package dev.koukeneko.hashi.service.platform.log;

import org.springframework.web.socket.WebSocketSession;

/**
 * Log 串流提供者介面
 * Linux: journalctl
 * Windows: Event Viewer (wevtutil)
 */
public interface LogStreamProvider {

    /**
     * 開始串流 log 到 WebSocket session
     * 
     * @return 啟動的 Process，用於後續管理
     */
    Process startLogStream(WebSocketSession session) throws Exception;

    /**
     * 停止 log 串流
     */
    void stopLogStream(Process process);
}
