package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record FirewallRuleDTO(
        Integer index,      // 規則編號 (刪除時需要這個 ID)
        String to,          // 目標 Port (e.g. "80/tcp")
        String action,      // 動作 (e.g. "ALLOW IN")
        String from,        // 來源 IP (e.g. "Anywhere")
        boolean ipv6        // 是否為 IPv6 規則
) {}