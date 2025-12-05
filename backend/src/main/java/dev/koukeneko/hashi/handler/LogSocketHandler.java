package dev.koukeneko.hashi.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
public class LogSocketHandler extends TextWebSocketHandler {

    // 存放 Session 對應的 Process
    private final Map<String, Process> processMap = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 執行 Linux 原生指令：journalctl
        // -f: follow (持續追蹤)
        // -n 100: 先吐出最後 100 行
        // --no-pager: 不要分頁
        ProcessBuilder builder = new ProcessBuilder("journalctl", "-f", "-n", "100", "--no-pager");

        // 如果想看特定服務的 log，可以改成: journalctl -u nginx -f
        // 這裡我們先看全系統 log

        try {
            Process process = builder.start();
            processMap.put(session.getId(), process);

            // 啟動執行緒讀取 Log 並推給前端
            streamLogs(process.getInputStream(), session);

        } catch (IOException e) {
            session.sendMessage(new TextMessage("Failed to start log stream: " + e.getMessage()));
            session.close();
        }
    }

    private void streamLogs(InputStream inputStream, WebSocketSession session) {
        executorService.submit(() -> {
            byte[] buffer = new byte[1024]; // 緩衝區
            int length;
            try {
                while ((length = inputStream.read(buffer)) != -1) {
                    if (session.isOpen()) {
                        // 直接送出文字
                        session.sendMessage(new TextMessage(new String(buffer, 0, length, StandardCharsets.UTF_8)));
                    } else {
                        break;
                    }
                }
            } catch (IOException e) {
                // Connection closed or process died
            }
        });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // 斷線時記得殺掉 Process，不然伺服器會有 zombie process
        Process process = processMap.remove(session.getId());
        if (process != null) {
            process.destroy();
        }
    }
}
