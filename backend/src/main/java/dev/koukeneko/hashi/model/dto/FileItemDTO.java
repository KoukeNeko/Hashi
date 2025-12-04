package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record FileItemDTO(
        String name,        // 檔名 (e.g. "nginx.conf")
        String path,        // 完整路徑 (e.g. "/etc/nginx/nginx.conf")
        boolean isDirectory,// 是否為資料夾
        long size,          // 大小 (Bytes)
        String permissions, // 權限 (e.g. "rwxr-xr-x")
        String lastModified // 最後修改時間 (ISO 8601 String)
) {}
