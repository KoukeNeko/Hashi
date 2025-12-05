package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record VmDTO(
        int id,             // 執行中的 ID (關機時為 -1)
        String uuid,        // 唯一識別碼
        String name,        // 名稱 (e.g. "win10-lab")
        String state,       // 狀態 (Running, Paused, Shutoff)
        int vcpu,           // CPU 核心數
        long memory,        // 記憶體 (Bytes)
        long maxMemory      // 最大分配記憶體
) {}