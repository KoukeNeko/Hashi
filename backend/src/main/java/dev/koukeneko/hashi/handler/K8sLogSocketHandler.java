package dev.koukeneko.hashi.handler;

import dev.koukeneko.hashi.service.k8s.K8sClientProvider;
import dev.koukeneko.hashi.service.k8s.K8sException;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.Call;
import okhttp3.Response;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class K8sLogSocketHandler extends TextWebSocketHandler {

    private static final Pattern K8S_NAME_PATTERN = Pattern.compile("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$");

    private final K8sClientProvider clientProvider;

    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private final Map<String, StreamContext> streamMap = new ConcurrentHashMap<>();

    private record StreamContext(Call call, Response response, Future<?> task) {
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            MultiValueMap<String, String> params = UriComponentsBuilder.fromUri(session.getUri())
                    .build()
                    .getQueryParams();

            String namespace = requiredParam(params, "namespace");
            String pod = requiredParam(params, "pod");
            String container = optionalParam(params, "container");

            validateK8sName(namespace, "namespace");
            validateK8sName(pod, "pod");
            if (container != null) {
                validateK8sName(container, "container");
            }

            Integer tailLines = parseInt(optionalParam(params, "tailLines"), 200, 1, 5000);
            Integer sinceSeconds = parseInt(optionalParam(params, "sinceSeconds"), null, 0, 86400 * 30);

            CoreV1Api api = new CoreV1Api(clientProvider.getClient());
            Call call = api.readNamespacedPodLogCall(
                    pod,
                    namespace,
                    container,
                    true,
                    null,
                    null,
                    null,
                    false,
                    sinceSeconds,
                    tailLines,
                    false,
                    null);

            Response response = call.execute();
            if (!response.isSuccessful() || response.body() == null) {
                String body = "";
                try {
                    if (response.body() != null) {
                        body = response.body().string();
                    }
                } finally {
                    response.close();
                }
                sendAndClose(session, "ERROR: Failed to open pod log stream. " + body);
                return;
            }

            Future<?> task = executorService.submit(() -> streamLogs(session, response));
            streamMap.put(session.getId(), new StreamContext(call, response, task));
        } catch (K8sException e) {
            sendAndClose(session, "ERROR: " + e.getMessage());
        } catch (ApiException e) {
            String body = e.getResponseBody() != null ? e.getResponseBody() : e.getMessage();
            sendAndClose(session, "ERROR: " + body);
        } catch (Exception e) {
            log.error("Failed to start k8s log stream", e);
            sendAndClose(session, "ERROR: Failed to start k8s log stream: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        stopStream(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        stopStream(session.getId());
    }

    private void streamLogs(WebSocketSession session, Response response) {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.body().byteStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!session.isOpen()) {
                    break;
                }
                session.sendMessage(new TextMessage(line));
            }
        } catch (IOException e) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage("ERROR: log stream interrupted: " + e.getMessage()));
                } catch (IOException ignored) {
                }
            }
        } finally {
            stopStream(session.getId());
            if (session.isOpen()) {
                try {
                    session.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private void stopStream(String sessionId) {
        StreamContext ctx = streamMap.remove(sessionId);
        if (ctx == null) {
            return;
        }

        try {
            ctx.call().cancel();
        } catch (Exception ignored) {
        }

        try {
            if (ctx.response() != null) {
                ctx.response().close();
            }
        } catch (Exception ignored) {
        }

        try {
            if (ctx.task() != null) {
                ctx.task().cancel(true);
            }
        } catch (Exception ignored) {
        }
    }

    @PreDestroy
    public void shutdown() {
        for (String sessionId : List.copyOf(streamMap.keySet())) {
            stopStream(sessionId);
        }
        executorService.shutdownNow();
    }

    private String requiredParam(MultiValueMap<String, String> params, String key) {
        String value = optionalParam(params, key);
        if (value == null || value.isBlank()) {
            throw new K8sException(400, key + " is required");
        }
        return value;
    }

    private String optionalParam(MultiValueMap<String, String> params, String key) {
        String value = params.getFirst(key);
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Integer parseInt(String value, Integer defaultValue, int min, int max) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            int parsed = Integer.parseInt(value);
            if (parsed < min || parsed > max) {
                throw new K8sException(400, "Invalid integer value: " + value + " (allowed " + min + ".." + max + ")");
            }
            return parsed;
        } catch (NumberFormatException e) {
            throw new K8sException(400, "Invalid integer value: " + value);
        }
    }

    private void validateK8sName(String value, String field) {
        if (!K8S_NAME_PATTERN.matcher(value).matches()) {
            throw new K8sException(400, field + " is not a valid Kubernetes name: " + value);
        }
    }

    private void sendAndClose(WebSocketSession session, String message) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(message));
                session.close();
            }
        } catch (Exception ignored) {
        }
    }
}
