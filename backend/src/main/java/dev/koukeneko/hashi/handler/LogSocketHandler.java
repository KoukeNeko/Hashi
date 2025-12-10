package dev.koukeneko.hashi.handler;

import dev.koukeneko.hashi.service.platform.log.LogStreamProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class LogSocketHandler extends TextWebSocketHandler {

    private final LogStreamProvider logStreamProvider;

    // 存放 Session 對應的 Process
    private final Map<String, Process> processMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            Process process = logStreamProvider.startLogStream(session);
            processMap.put(session.getId(), process);
        } catch (Exception e) {
            session.sendMessage(new TextMessage("Failed to start log stream: " + e.getMessage()));
            session.close();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // 斷線時記得殺掉 Process
        Process process = processMap.remove(session.getId());
        if (process != null) {
            logStreamProvider.stopLogStream(process);
        }
    }
}
