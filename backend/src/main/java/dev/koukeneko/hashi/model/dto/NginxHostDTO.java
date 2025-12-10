package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

/**
 * Nginx Virtual Host 資訊 DTO
 */
@Builder
public record NginxHostDTO(
        /** 設定檔名稱 (不含 .conf) */
        String name,
        /** 網域名稱 (server_name) */
        String domain,
        /** 監聽埠號 */
        int port,
        /** 網站類型: static / proxy / php */
        String type,
        /** 文件根目錄 (static/php 模式) */
        String root,
        /** 反向代理目標 URL (proxy 模式) */
        String proxyPass,
        /** 是否啟用 SSL */
        boolean sslEnabled,
        /** 網站是否啟用 (sites-enabled 中有 symlink) */
        boolean enabled,
        /** 設定檔完整路徑 */
        String configPath,
        /** 啟用 gzip 壓縮 */
        boolean gzip,
        /** 啟用 rate limiting */
        boolean rateLimit,
        /** 每秒請求數限制 */
        Integer rateLimitRate,
        /** 額外的 server_name (別名) */
        List<String> aliases) {
}
