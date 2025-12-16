package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemDiskDTO {
    private String name; // e.g., sda
    private String path; // e.g., /dev/sda
    private String model; // Hardware model
    private String serial; // Serial number
    private long size; // Size in bytes
    private String type; // disk, part, rom
    private boolean removable;
    private List<SystemPartitionDTO> partitions;
}
