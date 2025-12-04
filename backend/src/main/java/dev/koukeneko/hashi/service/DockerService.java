package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.ContainerDTO;

import java.util.List;

public interface DockerService {
    List<ContainerDTO> listContainers();

    // 控制容器狀態的方法
    void startContainer(String containerId);
    void stopContainer(String containerId);
    void restartContainer(String containerId);
}
