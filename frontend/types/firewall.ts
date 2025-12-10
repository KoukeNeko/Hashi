/**
 * Firewall and iptables related types
 */

/** UFW firewall rule */
export interface FirewallRule {
    index: number;
    to: string;
    action: string;
    from: string;
    ipv6: boolean;
}

/** iptables rule details */
export interface IptablesRule {
    lineNumber: number;
    table: string;
    chain: string;
    target: string;
    protocol: string;
    source: string;
    destination: string;
    inInterface: string;
    outInterface: string;
    sourcePort?: number;
    destPort?: number;
    options: string;
    packetCount: number;
    byteCount: number;
}

/** iptables table type */
export type IptablesTable = 'filter' | 'nat' | 'mangle';

/** iptables chain type */
export type IptablesChain = 'INPUT' | 'OUTPUT' | 'FORWARD' | 'PREROUTING' | 'POSTROUTING';

/** Request to add an iptables rule */
export interface AddIptablesRuleRequest {
    table?: string;
    chain: string;
    target: string;
    protocol?: string;
    source?: string;
    destination?: string;
    inInterface?: string;
    outInterface?: string;
    sourcePort?: number;
    destPort?: number;
    append?: boolean;
}
