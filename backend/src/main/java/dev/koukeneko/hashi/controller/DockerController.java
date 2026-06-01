package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.ContainerDTO;
import dev.koukeneko.hashi.model.dto.DockerImageDTO;
import dev.koukeneko.hashi.model.dto.DockerNetworkDTO;
import dev.koukeneko.hashi.model.dto.DockerStatusDTO;
import dev.koukeneko.hashi.model.dto.DockerVolumeDTO;
import dev.koukeneko.hashi.service.DockerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Docker 容器管理 Controller 提供容器的列表查詢與狀態控制 (啟動、停止、重啟)
 */
@RestController
@RequestMapping("/api/v1/docker")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DockerController {

    private final DockerService dockerService;

    /**
     * 探測 Docker 守護程序狀態 永遠回傳 200，由前端依 installed 欄位決定行為
     *
     * @return Docker 連線狀態 DTO
     */
    @GetMapping("/status")
    public ResponseEntity<DockerStatusDTO> getStatus() {
        return ResponseEntity.ok(dockerService.getStatus());
    }

    /**
     * 列出所有容器
     *
     * @return 容器列表
     */
    @GetMapping("/containers")
    public ResponseEntity<List<ContainerDTO>> listContainers() {
        return ResponseEntity.ok(dockerService.listContainers());
    }

    /**
     * 啟動指定容器
     *
     * @param id
     *           容器 ID
     * @return 成功回傳 200 OK
     */
    @PostMapping("/containers/{id}/start")
    public ResponseEntity<Void> startContainer(@PathVariable String id) {
        dockerService.startContainer(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 停止指定容器
     *
     * @param id
     *           容器 ID
     * @return 成功回傳 200 OK
     */
    @PostMapping("/containers/{id}/stop")
    public ResponseEntity<Void> stopContainer(@PathVariable String id) {
        dockerService.stopContainer(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 重啟指定容器
     *
     * @param id
     *           容器 ID
     * @return 成功回傳 200 OK
     */
    @PostMapping("/containers/{id}/restart")
    public ResponseEntity<Void> restartContainer(@PathVariable String id) {
        dockerService.restartContainer(id);
        return ResponseEntity.ok().build();
    }

    // ==================== Images ====================

    @GetMapping("/images")
    public ResponseEntity<List<DockerImageDTO>> listImages() {
        return ResponseEntity.ok(dockerService.listImages());
    }

    @PostMapping("/images/pull")
    public ResponseEntity<Void> pullImage(@RequestParam String repository, @RequestParam String tag) {
        dockerService.pullImage(repository, tag);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/images/{id}")
    public ResponseEntity<Void> removeImage(@PathVariable String id) {
        dockerService.removeImage(id);
        return ResponseEntity.ok().build();
    }

    // ==================== Networks ====================

    @GetMapping("/networks")
    public ResponseEntity<List<DockerNetworkDTO>> listNetworks() {
        return ResponseEntity.ok(dockerService.listNetworks());
    }

    @PostMapping("/networks")
    public ResponseEntity<Void> createNetwork(@RequestParam String name,
            @RequestParam(defaultValue = "bridge") String driver) {
        dockerService.createNetwork(name, driver);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/networks/{id}")
    public ResponseEntity<Void> removeNetwork(@PathVariable String id) {
        dockerService.removeNetwork(id);
        return ResponseEntity.ok().build();
    }

    // ==================== Volumes ====================

    @GetMapping("/volumes")
    public ResponseEntity<List<DockerVolumeDTO>> listVolumes() {
        return ResponseEntity.ok(dockerService.listVolumes());
    }

    @PostMapping("/volumes")
    public ResponseEntity<Void> createVolume(@RequestParam String name) {
        dockerService.createVolume(name);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/volumes/{name}")
    public ResponseEntity<Void> removeVolume(@PathVariable String name) {
        dockerService.removeVolume(name);
        return ResponseEntity.ok().build();
    }
}
