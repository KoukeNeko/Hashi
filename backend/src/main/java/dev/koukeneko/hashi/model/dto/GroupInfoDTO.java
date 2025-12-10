package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

/**
 * 群組資訊 DTO
 */
@Builder
public record GroupInfoDTO(
                /** 群組名稱 (e.g. "developers") */
                String name,
                /** 群組 ID (e.g. 1001) */
                int gid,
                /** 成員列表 */
                List<String> members) {
}
