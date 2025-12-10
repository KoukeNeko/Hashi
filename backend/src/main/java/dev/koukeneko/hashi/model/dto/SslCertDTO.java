package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * SSL 憑證資訊 DTO
 */
@Builder
public record SslCertDTO(
        /** 憑證網域 */
        String domain,
        /** 簽發者 (e.g. "Let's Encrypt") */
        String issuer,
        /** 到期日 (YYYY-MM-DD) */
        String expireDate,
        /** 剩餘天數 */
        int daysRemaining,
        /** 是否自動更新 */
        boolean autoRenew,
        /** 憑證檔路徑 */
        String certPath,
        /** 私鑰路徑 */
        String keyPath,
        /** 憑證來源: certbot / acme / manual */
        String source) {
}
