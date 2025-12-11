package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

/**
 * 系統狀態 DTO 用於儀表板顯示 CPU、RAM、硬碟和網路資訊
 */
@Builder
public record SystemStatusDTO(
        /** CPU 使用率 (0.0 ~ 100.0) */
        double cpuUsage,
        /** CPU 核心數 */
        int coreCount,
        /** 總記憶體 (bytes) */
        long totalMemory,
        /** 已使用記憶體 (bytes) */
        long usedMemory,
        /** 記憶體使用率 (0.0 ~ 100.0) */
        double memoryUsage,
        /** 作業系統名稱 */
        String osName,
        /** 系統負載 */
        double systemLoad,
        /** 硬碟資訊列表 */
        List<DiskInfo> disks,
        /** 網路資訊 */
        NetworkInfo network) {
    /**
     * 硬碟資訊
     */
    @Builder
    public record DiskInfo(
            /** 磁碟名稱 (e.g. "Local Disk" 或 "/dev/sda1") */
            String name,
            /** 掛載點 (e.g. "/" 或 "C:\") */
            String mount,
            /** 總容量 (bytes) */
            long totalSpace,
            /** 已使用容量 (bytes) */
            long usedSpace,
            /** 可用容量 (bytes) */
            long usableSpace) {
    }

    /**
     * 網路資訊
     */
    @Builder
    public record NetworkInfo(
            /** 上傳速率 (Bytes per second) */
            long uploadRate,
            /** 下載速率 (Bytes per second) */
            long downloadRate,
            /** 總發送量 (Bytes) */
            long totalSent,
            /** 總接收量 (Bytes) */
            long totalRecv) {
    }
}
