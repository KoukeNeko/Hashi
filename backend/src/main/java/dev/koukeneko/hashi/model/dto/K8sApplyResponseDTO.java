package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record K8sApplyResponseDTO(
        boolean success,
        boolean dryRun,
        List<K8sApplyItemResultDTO> results,
        List<String> warnings) {
}
