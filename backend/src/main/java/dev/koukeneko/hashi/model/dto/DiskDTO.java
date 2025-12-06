package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 磁碟設定 DTO
 * 用於建立和管理 VM 磁碟
 */
@Builder
public record DiskDTO(
        String name,        // 磁碟名稱 (e.g. "data", "backup")
        Long sizeGB,        // 磁碟大小 (GB) - 新建磁碟時使用
        String path,        // 磁碟路徑 - 現有磁碟時使用
        String format,      // 磁碟格式 (qcow2/raw)
        String bus,         // 匯流排類型 (virtio/sata/scsi/ide)
        String cache,       // 快取模式 (none/writeback/writethrough)
        String io,          // I/O 模式 (native/threads)
        Boolean bootable    // 是否為開機磁碟
) {
    /**
     * 建立新磁碟的簡易工廠方法
     */
    public static DiskDTO newDisk(String name, long sizeGB) {
        return DiskDTO.builder()
                .name(name)
                .sizeGB(sizeGB)
                .format("qcow2")
                .bus("virtio")
                .cache("none")
                .io("native")
                .bootable(false)
                .build();
    }

    /**
     * 附加現有磁碟的簡易工廠方法
     */
    public static DiskDTO existingDisk(String path) {
        return DiskDTO.builder()
                .path(path)
                .bus("virtio")
                .bootable(false)
                .build();
    }
}
