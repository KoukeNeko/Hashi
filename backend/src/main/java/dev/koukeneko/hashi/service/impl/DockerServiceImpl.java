package dev.koukeneko.hashi.service.impl;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;
import dev.koukeneko.hashi.model.dto.ContainerDTO;
import dev.koukeneko.hashi.model.dto.DockerImageDTO;
import dev.koukeneko.hashi.model.dto.DockerNetworkDTO;
import dev.koukeneko.hashi.model.dto.DockerVolumeDTO;
import dev.koukeneko.hashi.service.DockerService;
import com.github.dockerjava.api.model.Image;
import com.github.dockerjava.api.model.Network;
import com.github.dockerjava.api.command.InspectVolumeResponse;
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
        String ports = "";
        if (c.getPorts() != null) {
            ports = Arrays.stream(c.getPorts())
                    .map(port -> (port.getPublicPort() != null ? port.getPublicPort() + ":" : "")
                            + port.getPrivatePort())
                    .collect(Collectors.joining(", "));
        }

        // 處理名稱 (Docker API 回傳的名稱通常帶有 "/" 前綴，如 "/my-nginx")
        String name = (c.getNames() != null && c.getNames().length > 0)
                ? c.getNames()[0].substring(1)
                : "unknown";

        return ContainerDTO.builder()
                .id(c.getId().substring(0, Math.min(12, c.getId().length()))) // 只取短 ID，防止越界
                .name(name)
                .image(c.getImage() != null ? c.getImage() : "unknown")
                .state(c.getState() != null ? c.getState() : "unknown")
                .status(c.getStatus() != null ? c.getStatus() : "unknown")
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

    @Override
    public List<DockerImageDTO> listImages() {
        List<Image> images = dockerClient.listImagesCmd().exec();
        return images.stream().map(image -> {
            String repo = "<none>";
            String tag = "<none>";
            if (image.getRepoTags() != null && image.getRepoTags().length > 0) {
                String[] parts = image.getRepoTags()[0].split(":");
                if (parts.length > 0)
                    repo = parts[0];
                if (parts.length > 1)
                    tag = parts[1];
            }
            return DockerImageDTO.builder()
                    .id(image.getId().replace("sha256:", "").substring(0, 12))
                    .repository(repo)
                    .tag(tag)
                    .size(formatSize(image.getSize()))
                    .sizeBytes(image.getSize())
                    .created(formatCreated(image.getCreated()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public void pullImage(String repository, String tag) {
        try {
            dockerClient.pullImageCmd(repository)
                    .withTag(tag)
                    .start()
                    .awaitCompletion();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Pull image interrupted", e);
        }
    }

    @Override
    public void removeImage(String imageId) {
        dockerClient.removeImageCmd(imageId).exec();
    }

    @Override
    public List<DockerNetworkDTO> listNetworks() {
        List<Network> networks = dockerClient.listNetworksCmd().exec();
        return networks.stream().map(net -> {
            String subnet = "";
            String gateway = "";
            if (net.getIpam() != null && net.getIpam().getConfig() != null && !net.getIpam().getConfig().isEmpty()) {
                subnet = net.getIpam().getConfig().get(0).getSubnet();
                gateway = net.getIpam().getConfig().get(0).getGateway();
            }
            return DockerNetworkDTO.builder()
                    .id(net.getId().substring(0, 12))
                    .name(net.getName())
                    .driver(net.getDriver())
                    .scope(net.getScope())
                    .subnet(subnet)
                    .gateway(gateway)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public void createNetwork(String name, String driver) {
        dockerClient.createNetworkCmd()
                .withName(name)
                .withDriver(driver)
                .exec();
    }

    @Override
    public void removeNetwork(String networkId) {
        dockerClient.removeNetworkCmd(networkId).exec();
    }

    @Override
    public List<DockerVolumeDTO> listVolumes() {
        // volumes response is wrapped
        List<InspectVolumeResponse> volumes = dockerClient.listVolumesCmd().exec().getVolumes();
        if (volumes == null)
            return List.of();

        return volumes.stream().map(vol -> DockerVolumeDTO.builder()
                .name(vol.getName())
                .driver(vol.getDriver())
                .mountpoint(vol.getMountpoint())
                .created(null) // API might not expose this directly
                .build()).collect(Collectors.toList());
    }

    @Override
    public void createVolume(String name) {
        dockerClient.createVolumeCmd()
                .withName(name)
                .exec();
    }

    @Override
    public void removeVolume(String volumeName) {
        dockerClient.removeVolumeCmd(volumeName).exec();
    }

    private String formatSize(Long size) {
        if (size == null)
            return "0 B";
        String[] units = new String[] { "B", "KB", "MB", "GB", "TB" };
        int unitIndex = 0;
        double sizeDouble = size;
        while (sizeDouble >= 1024 && unitIndex < units.length - 1) {
            sizeDouble /= 1024;
            unitIndex++;
        }
        return String.format("%.2f %s", sizeDouble, units[unitIndex]);
    }

    private String formatCreated(Long createdTimestamp) {
        if (createdTimestamp == null)
            return "-";
        // Simple implementation, preferably use a Date formatter
        return new java.util.Date(createdTimestamp * 1000).toString();
    }
}
