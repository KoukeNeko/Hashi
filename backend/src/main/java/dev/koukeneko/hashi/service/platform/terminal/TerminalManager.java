package dev.koukeneko.hashi.service.platform.terminal;

import org.springframework.web.socket.WebSocketSession;

/**
 * 終端機管理介面
 * Linux: PTY + bash/zsh
 * Windows: PTY + cmd/powershell
 */
public interface TerminalManager {

    /**
     * 初始化終端機連線
     */
    void onTerminalInit(WebSocketSession session);

    /**
     * 處理使用者輸入指令
     */
    void onCommand(String sessionId, String command);

    /**
     * 調整終端機大小
     */
    void resizeTerminal(String sessionId, int cols, int rows);

    /**
     * 關閉終端機連線
     */
    void onTerminalClose(String sessionId);
}
