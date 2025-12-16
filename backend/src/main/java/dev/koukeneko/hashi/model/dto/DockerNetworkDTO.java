package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * Docker 網路資訊 DTO
 */
@Builder
public record DockerNetworkDTO(
        String id,
        String name,
        String driver,
        String scope,
        String subnet, // Extracted from IPAM Config
        String gateway // Extracted from IPAM Config
) {
}
