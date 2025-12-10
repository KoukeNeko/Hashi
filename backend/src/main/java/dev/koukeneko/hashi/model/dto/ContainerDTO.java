package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * Docker 容器資訊 DTO
 */
@Builder
public record ContainerDTO(
                /** 容器 ID */
                String id,
                /** 容器名稱 (例如 /nginx) */
                String name,
                /** 使用的映像檔 (例如 nginx:latest) */
                String image,
                /** 狀態 (running, exited, dead) */
                String state,
                /** 人類可讀狀態 (Up 2 hours) */
                String status,
                /** 簡化版的 port 對應 (例如 0.0.0.0:80->80/tcp) */
                String portMapping) {
}
