package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 儲存池中的磁碟資訊
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorageDiskDTO {

    /**
     * 磁碟裝置路徑 (如 /dev/sda1)
     */
    private String device;

    /**
     * 磁碟狀態 (active, spare, faulty, rebuilding)
     */
    private String status;

    /**
     * 磁碟容量 (bytes)
     */
    private long size;

    /**
     * 磁碟型號
     */
    private String model;

    /**
     * 序號
     */
    private String serial;

    /**
     * 在陣列中的角色編號
     */
    private Integer raidDiskNumber;
}
