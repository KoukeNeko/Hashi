package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * Docker 映像檔資訊 DTO
 */
@Builder
public record DockerImageDTO(
        String id,
        String repository, // Usually part of RepoTags
        String tag, // Usually part of RepoTags
        String size, // Human readable size
        String created, // Created time
        Long sizeBytes // Raw size in bytes
) {
}
