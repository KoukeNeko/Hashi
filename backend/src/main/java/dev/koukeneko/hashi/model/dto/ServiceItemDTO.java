package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record ServiceItemDTO(
        String name,        // 服務名稱 (e.g. "nginx.service")
        String description, // 描述 (e.g. "A high performance web server")
        String loadState,   // 載入狀態 (loaded, not-found)
        String activeState, // 活躍狀態 (active, inactive)
        String subState     // 詳細狀態 (running, exited, dead)
) {}
