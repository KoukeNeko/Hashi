package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

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
        double systemLoad,
        List<DiskInfo> disks,
        NetworkInfo network
) {
    // 定義內部的 Record，保持結構乾淨
    @Builder
    public record DiskInfo(
            String name,        // 例如 "Local Disk" 或 "/dev/sda1"
            String mount,       // 例如 "/" 或 "C:\"
            long totalSpace,
            long usedSpace,
            long usableSpace
    ) {}

    @Builder
    public record NetworkInfo(
            long uploadRate,    // 上傳速率 (Bytes per second)
            long downloadRate,  // 下載速率 (Bytes per second)
            long totalSent,     // 總發送量 (Bytes)
            long totalRecv      // 總接收量 (Bytes)
    ) {}
}