package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * Nginx 服務狀態 DTO
 */
@Builder
public record NginxStatusDTO(
        /** 服務是否正在運行 */
        boolean running,
        /** 服務是否已啟用 (開機自動啟動) */
        boolean enabled,
        /** Nginx 版本 */
        String version,
        /** 設定檔是否有效 */
        boolean configValid,
        /** 設定驗證訊息 */
        String configMessage) {
}
