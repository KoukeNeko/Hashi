package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * VNC 連線資訊 DTO
 */
@Builder
public record VncInfoDTO(
                /** VNC 主機 (通常是 localhost 或 0.0.0.0) */
                String host,
                /** VNC 埠號 (5900+) */
                int port,
                /** VNC 密碼 (如果有設定) */
                String password,
                /** WebSocket 代理 URL */
                String websocketUrl) {
}
