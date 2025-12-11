package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 新增 iptables 規則的請求結構
 */
@Builder
public record AddIptablesRuleRequest(
        /** 表格名稱: filter / nat / mangle (預設 filter) */
        String table,
        /** 鏈名稱: INPUT / OUTPUT / FORWARD / PREROUTING / POSTROUTING */
        String chain,
        /** 目標動作: ACCEPT / DROP / REJECT / MASQUERADE */
        String target,
        /** 協定: tcp / udp / icmp / all */
        String protocol,
        /** 來源 IP/CIDR (可選) */
        String source,
        /** 目標 IP/CIDR (可選) */
        String destination,
        /** 進入介面 (可選) */
        String inInterface,
        /** 輸出介面 (可選) */
        String outInterface,
        /** 來源 Port (可選) */
        Integer sourcePort,
        /** 目標 Port (可選) */
        Integer destPort,
        /** true = append (-A), false = insert (-I)，預設 true */
        Boolean append) {
}
