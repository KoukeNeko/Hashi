package dev.koukeneko.hashi.model.dto;

import lombok.Data;

@Data
public class NetworkConfigDTO {
    private String ipv4Method;
    private String ipAddress;
    private String gateway;
}
