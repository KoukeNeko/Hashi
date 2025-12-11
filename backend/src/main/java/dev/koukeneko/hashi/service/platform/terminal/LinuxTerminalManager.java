package dev.koukeneko.hashi.service.platform.terminal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pty4j.PtyProcess;
import com.pty4j.PtyProcessBuilder;
import com.pty4j.WinSize;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Linux 終端機管理實作 (使用 PTY4J + bash)
 */
@Slf4j
public class LinuxTerminalManager implements TerminalManager {

    private static final String[] SHELL_COMMAND = {"/bin/bash"};

    private final Map<String, PtyProcess> processMap = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void onTerminalInit(WebSocketSession session) {
        try {
            Map<String, String> envs = new HashMap<>(System.getenv());
            envs.put("TERM", "xterm-256color");

            PtyProcess process = new PtyProcessBuilder(SHELL_COMMAND)
                    .setEnvironment(envs)
                    .setInitialColumns(80)
                    .setInitialRows(24)
                    .start();

            processMap.put(session.getId(), process);

            printOutputToWebSocket(process.getInputStream(), session);

        } catch (IOException e) {
            log.error("Failed to start terminal", e);
        }
    }

    @Override
    public void onCommand(String sessionId, String command) {
        PtyProcess process = processMap.get(sessionId);
        if (process != null) {
            try {
                // 檢查是否為 resize 指令 (JSON 格式)
                if (command.startsWith("{") && command.contains("\"type\"")) {
                    handleJsonCommand(sessionId, command);
                    return;
                }

                OutputStream os = process.getOutputStream();
                os.write(command.getBytes(StandardCharsets.UTF_8));
                os.flush();
            } catch (IOException e) {
                log.error("Failed to write to terminal", e);
            }
        }
    }

    @Override
    public void resizeTerminal(String sessionId, int cols, int rows) {
        PtyProcess process = processMap.get(sessionId);
        if (process != null) {
            try {
                WinSize winSize = new WinSize(cols, rows);
                process.setWinSize(winSize);
                log.debug("Terminal resized to {}x{} for session {}", cols, rows, sessionId);
            } catch (Exception e) {
                log.error("Failed to resize terminal", e);
            }
        }
    }

    @Override
    public void onTerminalClose(String sessionId) {
        PtyProcess process = processMap.get(sessionId);
        if (process != null) {
            process.destroy();
            processMap.remove(sessionId);
        }
    }

    private void handleJsonCommand(String sessionId, String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            String type = node.has("type") ? node.get("type").asText() : "";

            if ("resize".equals(type)) {
                int cols = node.get("cols").asInt();
                int rows = node.get("rows").asInt();
                resizeTerminal(sessionId, cols, rows);
            }
        } catch (Exception e) {
            log.error("Failed to parse JSON command: {}", json, e);
        }
    }

    private void printOutputToWebSocket(InputStream inputStream, WebSocketSession session) {
        executorService.submit(() -> {
            byte[] buffer = new byte[1024];
            int length;
            try {
                while ((length = inputStream.read(buffer)) != -1) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(new String(buffer, 0, length, StandardCharsets.UTF_8)));
                    }
                }
            } catch (IOException e) {
                // Process 結束或串流中斷
            }
        });
    }
}
