package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record AuthResponseDTO(
        boolean success,
        String message,
        UserInfoDTO user
) {}
