package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record VncInfoDTO(
        String host,       // VNC 主機 (通常是 localhost 或 0.0.0.0)
        int port,          // VNC 埠號 (5900+)
        String password,   // VNC 密碼 (如果有設定)
        String websocketUrl // WebSocket 代理 URL
) {}
