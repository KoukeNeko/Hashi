package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record ContainerDTO(
        String id,
        String name,        // 容器名稱 (例如 /nginx)
        String image,       // 使用的映像檔 (例如 nginx:latest)
        String state,       // 狀態 (running, exited, dead)
        String status,      // 人類可讀狀態 (Up 2 hours)
        String portMapping  // 簡化版的 port 對應 (例如 0.0.0.0:80->80/tcp)
) {}
