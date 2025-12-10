package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 新增 iptables 規則的請求結構
 */
@Builder
public record AddIptablesRuleRequest(
        String table,           // filter / nat / mangle (預設 filter)
        String chain,           // INPUT / OUTPUT / FORWARD / PREROUTING / POSTROUTING
        String target,          // ACCEPT / DROP / REJECT / MASQUERADE
        String protocol,        // tcp / udp / icmp / all
        String source,          // 來源 IP/CIDR (可選)
        String destination,     // 目標 IP/CIDR (可選)
        String inInterface,     // 進入介面 (可選)
        String outInterface,    // 輸出介面 (可選)
        Integer sourcePort,     // 來源 port (可選)
        Integer destPort,       // 目標 port (可選)
        Boolean append          // true = append (-A), false = insert (-I) (預設 true)
) {}
