package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record IsoFileDTO(
        String name,       // 檔案名稱 (e.g. "ubuntu-22.04.iso")
        String path,       // 完整路徑 (e.g. "/var/lib/libvirt/images/ubuntu-22.04.iso")
        long size          // 檔案大小 (bytes)
) {}
