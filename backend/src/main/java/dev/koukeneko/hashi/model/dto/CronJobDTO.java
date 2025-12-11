package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 排程任務 (Cron Job) DTO
 */
@Builder
public record CronJobDTO(
        /** 前端用的唯一識別碼 UUID */
        String id,
        /** Cron 表達式 (e.g. "0 3 * * *") */
        String expression,
        /** 要執行的指令 (e.g. "/backup.sh") */
        String command,
        /** 註解 (選用) */
        String comment) {
}
