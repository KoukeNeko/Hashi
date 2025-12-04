package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record CronJobDTO(
        String id,          // 前端用的唯一識別碼 UUID
        String expression,  // e.g. "0 3 * * *"
        String command,     // e.g. "/backup.sh"
        String comment      // (選用) 如果想解析註解的話
) {}
