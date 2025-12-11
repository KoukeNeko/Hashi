package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * UFW 防火牆規則 DTO
 */
@Builder
public record FirewallRuleDTO(
        /** 規則編號 (刪除時需要這個 ID) */
        Integer index,
        /** 目標 Port (e.g. "80/tcp") */
        String to,
        /** 動作 (e.g. "ALLOW IN") */
        String action,
        /** 來源 IP (e.g. "Anywhere") */
        String from,
        /** 是否為 IPv6 規則 */
        boolean ipv6) {
}
