package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.ContainerDTO;
import dev.koukeneko.hashi.service.DockerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Docker 容器管理 Controller
 * 提供容器的列表查詢與狀態控制 (啟動、停止、重啟)
 */
@RestController
@RequestMapping("/api/v1/docker")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DockerController {

    private final DockerService dockerService;

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
     * @param id 容器 ID
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
     * @param id 容器 ID
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
     * @param id 容器 ID
     * @return 成功回傳 200 OK
     */
    @PostMapping("/containers/{id}/restart")
    public ResponseEntity<Void> restartContainer(@PathVariable String id) {
        dockerService.restartContainer(id);
        return ResponseEntity.ok().build();
    }
}
