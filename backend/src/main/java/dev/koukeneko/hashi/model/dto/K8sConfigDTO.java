package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record K8sConfigDTO(
        String effectivePath,
        String source,
        String overridePath,
        boolean canEdit) {
}
