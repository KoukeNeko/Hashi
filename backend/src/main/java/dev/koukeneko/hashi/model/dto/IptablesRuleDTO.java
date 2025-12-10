package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * iptables 規則資料結構
 * 對應 iptables -L -n -v --line-numbers 的輸出
 */
@Builder
public record IptablesRuleDTO(
        int lineNumber,         // 規則行號（刪除時使用）
        String table,           // filter / nat / mangle
        String chain,           // INPUT / OUTPUT / FORWARD / PREROUTING / POSTROUTING
        String target,          // ACCEPT / DROP / REJECT / MASQUERADE / SNAT / DNAT
        String protocol,        // tcp / udp / icmp / all
        String source,          // 來源 IP/CIDR
        String destination,     // 目標 IP/CIDR
        String inInterface,     // 進入介面
        String outInterface,    // 輸出介面
        Integer sourcePort,     // 來源 port
        Integer destPort,       // 目標 port
        String options,         // 其他選項（原始字串）
        long packetCount,       // 封包計數
        long byteCount          // 位元組計數
) {}
