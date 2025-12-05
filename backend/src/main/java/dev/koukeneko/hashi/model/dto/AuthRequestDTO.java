package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record AuthRequestDTO(
        String username,
        String password
) {}
