package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record CreateVmDTO(
        String name,        // VM 名稱 (e.g. "ubuntu-server")
        int vcpu,           // CPU 核心數
        long memoryMB,      // 記憶體 (MB)
        long diskGB,        // 磁碟大小 (GB)
        String isoPath,     // ISO 映像路徑 (e.g. "/var/lib/libvirt/images/ubuntu.iso")
        String osType,      // 作業系統類型 (linux/windows)
        String osVariant    // 作業系統變體 (e.g. "ubuntu22.04", "win11")
) {}
