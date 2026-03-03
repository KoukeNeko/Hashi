package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record K8sNamespaceDTO(
        String name,
        String phase,
        String age) {
}
