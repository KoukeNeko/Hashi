package dev.koukeneko.hashi.service.impl;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;
import dev.koukeneko.hashi.model.dto.ContainerDTO;
import dev.koukeneko.hashi.service.DockerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DockerServiceImpl implements DockerService {

    private final DockerClient dockerClient;

    @Override
    public List<ContainerDTO> listContainers() {
        // 呼叫 Docker API: docker ps -a
        List<Container> containers = dockerClient.listContainersCmd()
                .withShowAll(true) // 包含已停止的容器
                .exec();

        return containers.stream()
                .map(this::mapToDTO)
                .toList();
    }

    private ContainerDTO mapToDTO(Container c) {
        // 處理 Port 顯示邏輯 (簡化版)
        String ports = Arrays.stream(c.getPorts())
                .map(port -> (port.getPublicPort() != null ? port.getPublicPort() + ":" : "") + port.getPrivatePort())
                .collect(Collectors.joining(", "));

        // 處理名稱 (Docker API 回傳的名稱通常帶有 "/" 前綴，如 "/my-nginx")
        String name = (c.getNames() != null && c.getNames().length > 0)
                ? c.getNames()[0].substring(1)
                : "unknown";

        return ContainerDTO.builder()
                .id(c.getId().substring(0, 12)) // 只取短 ID
                .name(name)
                .image(c.getImage())
                .state(c.getState())
                .status(c.getStatus())
                .portMapping(ports)
                .build();
    }

    @Override
    public void startContainer(String containerId) {
        dockerClient.startContainerCmd(containerId).exec();
    }

    @Override
    public void stopContainer(String containerId) {
        // 這裡可以不用參數，預設就是等待 10 秒後強殺
        dockerClient.stopContainerCmd(containerId).exec();
    }

    @Override
    public void restartContainer(String containerId) {
        // 重啟通常也包含「等待停止」的過程，這裡設定等待 5 秒
        dockerClient.restartContainerCmd(containerId).withTimeout(5).exec();
    }
}
