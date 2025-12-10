package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.ContainerDTO;

import java.util.List;

/**
 * Docker 容器管理服務介面
 */
public interface DockerService {
    /**
     * 列出所有容器
     *
     * @return 容器列表
     */
    List<ContainerDTO> listContainers();

    /**
     * 啟動指定容器
     *
     * @param containerId 容器 ID
     */
    void startContainer(String containerId);

    /**
     * 停止指定容器
     *
     * @param containerId 容器 ID
     */
    void stopContainer(String containerId);

    /**
     * 重啟指定容器
     *
     * @param containerId 容器 ID
     */
    void restartContainer(String containerId);
}
