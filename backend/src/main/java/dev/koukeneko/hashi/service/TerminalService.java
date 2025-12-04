package dev.koukeneko.hashi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pty4j.PtyProcess;
import com.pty4j.PtyProcessBuilder;
import com.pty4j.WinSize;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
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

@Service
@Slf4j
public class TerminalService {

    // 用來存放每個 WebSocket Session 對應的 Linux Process
    private final Map<String, PtyProcess> processMap = new ConcurrentHashMap<>();
    // 執行緒池，用來非同步讀取 Linux 的輸出
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    // JSON 解析器
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 當前端連上 WebSocket 時，啟動一個新的 Bash
     */
    public void onTerminalInit(WebSocketSession session) {
        try {
            // 1. 設定環境變數 (模擬 xterm-256color 才能有顏色)
            Map<String, String> envs = new HashMap<>(System.getenv());
            envs.put("TERM", "xterm-256color");

            // 2. 啟動 PTY Process (Bash)
            // 你可以把 /bin/bash 換成 /bin/zsh (如果機器有的話)
            String[] command = {"/bin/bash"};
            PtyProcess process = new PtyProcessBuilder(command)
                    .setEnvironment(envs)
                    .setInitialColumns(80)
                    .setInitialRows(24)
                    .start();

            processMap.put(session.getId(), process);

            // 3. 啟動一個執行緒，專門負責「偷聽」Bash 講了什麼，然後轉發給 WebSocket
            printOutputToWebSocket(process.getInputStream(), session);

        } catch (IOException e) {
            log.error("Failed to start terminal", e);
        }
    }

    /**
     * 當前端傳來鍵盤按鍵時 (由 WebSocketHandler 呼叫)
     */
    public void onCommand(String sessionId, String command) {
        PtyProcess process = processMap.get(sessionId);
        if (process != null) {
            try {
                // 先檢查是否為 resize 指令 (JSON 格式)
                if (command.startsWith("{") && command.contains("\"type\"")) {
                    handleJsonCommand(sessionId, command);
                    return;
                }
                
                OutputStream os = process.getOutputStream();
                // 把前端的指令寫入 Bash 的 Standard Input
                os.write(command.getBytes(StandardCharsets.UTF_8));
                os.flush();
            } catch (IOException e) {
                log.error("Failed to write to terminal", e);
            }
        }
    }

    /**
     * 處理 JSON 格式的指令 (如 resize)
     */
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

    /**
     * 調整終端機大小
     */
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

    /**
     * 當前端斷線時，殺掉 Bash
     */
    public void onTerminalClose(String sessionId) {
        PtyProcess process = processMap.get(sessionId);
        if (process != null) {
            process.destroy();
            processMap.remove(sessionId);
        }
    }

    // 背景執行緒：不斷讀取 Bash 的輸出，推播給前端
    private void printOutputToWebSocket(InputStream inputStream, WebSocketSession session) {
        executorService.submit(() -> {
            byte[] buffer = new byte[1024];
            int i;
            try {
                while ((i = inputStream.read(buffer)) != -1) {
                    if (session.isOpen()) {
                        // 把 byte[] 轉成文字發送
                        session.sendMessage(new TextMessage(new String(buffer, 0, i, StandardCharsets.UTF_8)));
                    }
                }
            } catch (IOException e) {
                // Process 結束或串流中斷
            }
        });
    }
}
