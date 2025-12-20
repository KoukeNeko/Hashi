package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 儲存池資料傳輸物件
 * 用於 mdadm RAID 陣列和未來的 ZFS pool
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoragePoolDTO {

    /**
     * 儲存池名稱 (如 md0, tank)
     */
    private String name;

    /**
     * 裝置路徑 (如 /dev/md0)
     */
    private String device;

    /**
     * 儲存提供者 ("mdadm" 或 "zfs")
     */
    private String provider;

    /**
     * RAID 等級 (raid0, raid1, raid5, raid6, raid10, mirror, raidz...)
     */
    private String level;

    /**
     * 狀態 (ONLINE, DEGRADED, REBUILDING, OFFLINE)
     */
    private String status;

    /**
     * 總容量 (bytes)
     */
    private long totalSize;

    /**
     * 已使用容量 (bytes)
     */
    private long usedSize;

    /**
     * 組成磁碟數量
     */
    private int diskCount;

    /**
     * 活動磁碟數量
     */
    private int activeDiskCount;

    /**
     * 備用磁碟數量
     */
    private int spareDiskCount;

    /**
     * 重建進度 (0-100), null 表示未在重建
     */
    private Double rebuildProgress;

    /**
     * UUID
     */
    private String uuid;

    /**
     * 組成磁碟列表
     */
    private List<StorageDiskDTO> disks;
}
