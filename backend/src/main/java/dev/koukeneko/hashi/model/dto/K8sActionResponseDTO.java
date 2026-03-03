package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record K8sActionResponseDTO(
        boolean success,
        String message,
        Integer replicas,
        String serverVersion,
        String effectivePath,
        String source) {
}
