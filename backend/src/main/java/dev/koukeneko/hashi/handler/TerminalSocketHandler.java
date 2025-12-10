package dev.koukeneko.hashi.handler;

import dev.koukeneko.hashi.service.platform.terminal.TerminalManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
@RequiredArgsConstructor
public class TerminalSocketHandler extends TextWebSocketHandler {

    private final TerminalManager terminalManager;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 連線建立，啟動 Shell
        terminalManager.onTerminalInit(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 收到前端按鍵 (xterm.js 傳來的)
        terminalManager.onCommand(session.getId(), message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // 斷線，清理資源
        terminalManager.onTerminalClose(session.getId());
    }
}
