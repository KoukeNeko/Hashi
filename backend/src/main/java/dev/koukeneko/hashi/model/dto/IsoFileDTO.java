package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * ISO 檔案資訊 DTO
 */
@Builder
public record IsoFileDTO(
        /** 檔案名稱 (e.g. "ubuntu-22.04.iso") */
        String name,
        /** 完整路徑 (e.g. "/var/lib/libvirt/images/ubuntu-22.04.iso") */
        String path,
        /** 檔案大小 (bytes) */
        long size) {
}
