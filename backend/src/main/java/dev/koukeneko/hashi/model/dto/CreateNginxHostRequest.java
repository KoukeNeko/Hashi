package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

/**
 * 建立 Nginx Virtual Host 請求
 */
@Builder
public record CreateNginxHostRequest(
        /** 設定檔名稱 (不含 .conf，預設使用 domain) */
        String name,
        /** 網域名稱 (必填) */
        String domain,
        /** 監聽埠號 (預設 80) */
        Integer port,
        /** 網站類型: static / proxy / php (預設 static) */
        String type,
        /** 文件根目錄 (static/php 必填) */
        String root,
        /** 反向代理目標 URL (proxy 必填) */
        String proxyPass,
        /** 是否自動申請 SSL */
        Boolean requestSsl,
        /** SSL 申請方式: certbot / acme */
        String sslProvider,
        /** 啟用 gzip (預設 true) */
        Boolean gzip,
        /** 啟用 rate limiting */
        Boolean rateLimit,
        /** 每秒請求數限制 (預設 10) */
        Integer rateLimitRate,
        /** 額外的 server_name (別名) */
        List<String> aliases) {
}
