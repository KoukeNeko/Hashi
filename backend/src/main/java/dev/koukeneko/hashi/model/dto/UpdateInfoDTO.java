package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 更新資訊 DTO
 * 包含當前版本、最新版本、更新狀態等資訊
 */
@Builder
public record UpdateInfoDTO(
                /** 目前安裝的版本 */
                String currentVersion,
                /** 最新可用版本 */
                String latestVersion,
                /** 是否有可用更新 */
                boolean updateAvailable,
                /** 目前的更新頻道 (stable, beta, dev) */
                String channel,
                /** 最新版本的發布說明 */
                String releaseNotes,
                /** 最新版本的下載連結 */
                String downloadUrl,
                /** 最後檢查時間 (ISO 8601 格式) */
                String lastChecked) {
}
