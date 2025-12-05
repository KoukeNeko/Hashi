package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record GroupInfoDTO(
        String name,            // 群組名稱 (e.g. "developers")
        int gid,                // 群組 ID (e.g. 1001)
        List<String> members    // 成員列表
) {}
