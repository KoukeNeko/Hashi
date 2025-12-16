package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetworkAddressDTO {
    private String family; // inet, inet6
    private String local; // IP address
    private int prefixlen; // CIDR prefix length
    private String scope; // global, link, host
}
