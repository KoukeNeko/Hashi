package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record K8sNodeDTO(
        String name,
        String status,
        String roles,
        String version,
        String internalIp,
        String age) {
}
