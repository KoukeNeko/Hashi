package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record K8sWorkloadDTO(
        String namespace,
        String kind,
        String name,
        String ready,
        Integer replicas,
        Integer availableReplicas,
        String age) {
}
