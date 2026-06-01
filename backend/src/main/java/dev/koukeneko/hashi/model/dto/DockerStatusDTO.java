package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * Docker 守護程序連線狀態 DTO 用於前端判斷是否需要顯示安裝指引
 */
@Builder
public record DockerStatusDTO(
        boolean installed,
        String daemonVersion,
        String apiVersion,
        String socketPath,
        String message) {
}
