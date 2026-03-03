package dev.koukeneko.hashi.service.k8s;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.apis.VersionApi;
import io.kubernetes.client.openapi.models.VersionInfo;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.Reader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
@RequiredArgsConstructor
@Slf4j
public class K8sClientProvider {

    public record ConnectionTestResult(boolean success, String serverVersion, String context, String message) {
    }

    private final K8sConfigService configService;

    private volatile CachedClient cachedClient;

    private record CachedClient(String path, String context, ApiClient client) {
    }

    public ApiClient getClient() {
        K8sConfigService.ResolvedConfig resolved = configService.resolveConfig();
        String effectivePath = resolved.effectivePath();

        if (effectivePath == null || effectivePath.isBlank()) {
            throw new K8sException(400,
                    "No kubeconfig available. Set HASHI_KUBECONFIG or configure an override in K3s settings.");
        }

        CachedClient local = cachedClient;
        if (local != null && local.path().equals(effectivePath)) {
            return local.client();
        }

        synchronized (this) {
            local = cachedClient;
            if (local != null && local.path().equals(effectivePath)) {
                return local.client();
            }

            CachedClient built = buildCachedClient(effectivePath);
            cachedClient = built;
            return built.client();
        }
    }

    public String getCurrentContext() {
        K8sConfigService.ResolvedConfig resolved = configService.resolveConfig();
        String effectivePath = resolved.effectivePath();
        if (effectivePath == null || effectivePath.isBlank()) {
            return null;
        }

        CachedClient local = cachedClient;
        if (local != null && local.path().equals(effectivePath)) {
            return local.context();
        }

        synchronized (this) {
            local = cachedClient;
            if (local != null && local.path().equals(effectivePath)) {
                return local.context();
            }
            CachedClient built = buildCachedClient(effectivePath);
            cachedClient = built;
            return built.context();
        }
    }

    public ConnectionTestResult testConnection(String kubeconfigPath) {
        if (kubeconfigPath == null || kubeconfigPath.isBlank()) {
            throw new K8sException(400, "kubeconfigPath is required");
        }

        Path path = Paths.get(kubeconfigPath).toAbsolutePath().normalize();
        if (!Files.exists(path) || !Files.isRegularFile(path)) {
            throw new K8sException(400, "kubeconfig file does not exist: " + path);
        }

        if (!Files.isReadable(path)) {
            throw new K8sException(400, "kubeconfig file is not readable: " + path);
        }

        try {
            CachedClient testClient = buildCachedClient(path.toString());
            VersionApi versionApi = new VersionApi(testClient.client());
            VersionInfo version = versionApi.getCode();
            String versionStr = version.getGitVersion() != null ? version.getGitVersion() : "unknown";
            return new ConnectionTestResult(true, versionStr, testClient.context(), "Connection successful");
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to connect using specified kubeconfig");
        } catch (IOException e) {
            throw new K8sException(500, "Failed to load kubeconfig: " + e.getMessage(), e);
        }
    }

    public void invalidateCache() {
        synchronized (this) {
            cachedClient = null;
        }
    }

    private CachedClient buildCachedClient(String kubeconfigPath) {
        try {
            ApiClient client = buildClient(kubeconfigPath);
            String context = readCurrentContext(kubeconfigPath);
            return new CachedClient(kubeconfigPath, context, client);
        } catch (IOException e) {
            throw new K8sException(500, "Failed to initialize Kubernetes client: " + e.getMessage(), e);
        }
    }

    private ApiClient buildClient(String kubeconfigPath) throws IOException {
        Path path = Paths.get(kubeconfigPath).toAbsolutePath().normalize();
        try (Reader reader = Files.newBufferedReader(path)) {
            KubeConfig kubeConfig = KubeConfig.loadKubeConfig(reader);
            ApiClient client = ClientBuilder.kubeconfig(kubeConfig).build();
            client.setReadTimeout(0);
            return client;
        }
    }

    private String readCurrentContext(String kubeconfigPath) throws IOException {
        Path path = Paths.get(kubeconfigPath).toAbsolutePath().normalize();
        try (Reader reader = Files.newBufferedReader(path)) {
            KubeConfig kubeConfig = KubeConfig.loadKubeConfig(reader);
            return kubeConfig.getCurrentContext();
        }
    }

    private K8sException mapApiException(ApiException e, String fallbackMessage) {
        int code = e.getCode();
        String body = e.getResponseBody();
        String message = (body != null && !body.isBlank()) ? body : fallbackMessage;

        if (code == 401 || code == 403) {
            return new K8sException(403, message, e);
        }
        if (code == 404) {
            return new K8sException(404, message, e);
        }
        if (code == 409) {
            return new K8sException(409, message, e);
        }
        if (code >= 400 && code < 500) {
            return new K8sException(400, message, e);
        }
        return new K8sException(500, message, e);
    }
}
