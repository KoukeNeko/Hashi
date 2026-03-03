package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record K8sApplyItemResultDTO(
        String kind,
        String namespace,
        String name,
        String action,
        String status,
        String message) {
}
