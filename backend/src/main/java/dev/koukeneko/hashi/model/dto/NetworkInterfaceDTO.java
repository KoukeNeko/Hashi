package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetworkInterfaceDTO {
    private int ifindex;
    private String ifname;
    private String operstate; // UP, DOWN, UNKNOWN
    private String address; // MAC address
    private String qdisc; // Queuing discipline
    private String master; // Master device (bridge/bond)
    private int mtu;
    private List<NetworkAddressDTO> addr_info;
}
