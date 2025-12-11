package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * iptables 規則資料結構 對應 iptables -L -n -v --line-numbers 的輸出
 */
@Builder
public record IptablesRuleDTO(
        /** 規則行號（刪除時使用） */
        int lineNumber,
        /** 表格名稱: filter / nat / mangle */
        String table,
        /** 鏈名稱: INPUT / OUTPUT / FORWARD / PREROUTING / POSTROUTING */
        String chain,
        /** 目標動作: ACCEPT / DROP / REJECT / MASQUERADE / SNAT / DNAT */
        String target,
        /** 協定: tcp / udp / icmp / all */
        String protocol,
        /** 來源 IP/CIDR */
        String source,
        /** 目標 IP/CIDR */
        String destination,
        /** 進入介面 */
        String inInterface,
        /** 輸出介面 */
        String outInterface,
        /** 來源 Port */
        Integer sourcePort,
        /** 目標 Port */
        Integer destPort,
        /** 其他選項（原始字串） */
        String options,
        /** 封包計數 */
        long packetCount,
        /** 位元組計數 */
        long byteCount) {
}
