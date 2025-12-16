package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemPartitionDTO {
    private String name; // e.g., sda1
    private String path; // e.g., /dev/sda1
    private long size; // Size in bytes
    private String fstype; // e.g., ext4, vfat
    private String mountpoint; // e.g., /boot
    private String uuid; // Filesystem UUID
    private String label; // Filesystem Label
}
