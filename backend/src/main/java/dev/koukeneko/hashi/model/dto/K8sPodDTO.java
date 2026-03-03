package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record K8sPodDTO(
        String namespace,
        String name,
        String status,
        String node,
        String ready,
        Integer restarts,
        String age,
        List<String> containers) {
}
