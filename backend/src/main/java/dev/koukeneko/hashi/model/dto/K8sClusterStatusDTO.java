package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record K8sClusterStatusDTO(
        boolean connected,
        String serverVersion,
        String context,
        String kubeconfigPath,
        String kubeconfigSource,
        String message) {
}
