export interface NetworkAddress {
    family: string;
    local: string;
    prefixlen: number;
    scope: string;
}

export interface NetworkInterface {
    ifindex: number;
    ifname: string;
    operstate: 'UP' | 'DOWN' | 'UNKNOWN' | string;
    address: string;
    qdisc: string;
    master?: string;
    mtu: number;
    addr_info: NetworkAddress[];
}
