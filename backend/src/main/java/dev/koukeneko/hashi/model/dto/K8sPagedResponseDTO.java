package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record K8sPagedResponseDTO<T>(
        List<T> items,
        int total,
        int page,
        int pageSize) {
}
