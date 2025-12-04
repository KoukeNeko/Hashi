package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

// 使用 Record，Java 編譯器會自動產生建構子、getter (注意：是 .cpuUsage() 不是 .getCpuUsage())
// 我們保留 @Builder，因為當欄位很多時，Builder pattern 還是比 new Record(a, b, c, d...) 好讀
@Builder
public record SystemStatusDTO(
        double cpuUsage,
        int coreCount,
        long totalMemory,
        long usedMemory,
        double memoryUsage,
        String osName,
        double systemLoad
) {}