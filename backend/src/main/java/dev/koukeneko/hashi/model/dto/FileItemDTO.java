package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 檔案項目 DTO
 */
@Builder
public record FileItemDTO(
        /** 檔名 (e.g. "nginx.conf") */
        String name,
        /** 完整路徑 (e.g. "/etc/nginx/nginx.conf") */
        String path,
        /** 是否為資料夾 */
        boolean isDirectory,
        /** 大小 (Bytes) */
        long size,
        /** 權限 (e.g. "rwxr-xr-x") */
        String permissions,
        /** 最後修改時間 (ISO 8601 String) */
        String lastModified) {
}
