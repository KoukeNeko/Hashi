package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * Docker 儲存卷資訊 DTO
 */
@Builder
public record DockerVolumeDTO(
        String name,
        String driver,
        String mountpoint,
        String created) {
}
