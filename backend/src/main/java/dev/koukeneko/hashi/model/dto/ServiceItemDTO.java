package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 系統服務項目 DTO
 */
@Builder
public record ServiceItemDTO(
        /** 服務名稱 (e.g. "nginx.service") */
        String name,
        /** 描述 (e.g. "A high performance web server") */
        String description,
        /** 載入狀態 (loaded, not-found) */
        String loadState,
        /** 活躍狀態 (active, inactive) */
        String activeState,
        /** 詳細狀態 (running, exited, dead) */
        String subState) {
}
