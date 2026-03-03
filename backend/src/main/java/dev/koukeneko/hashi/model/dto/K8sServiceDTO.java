package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record K8sServiceDTO(
        String namespace,
        String name,
        String type,
        String clusterIp,
        String externalIp,
        String ports,
        String age) {
}
