package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.ContainerDTO;
import dev.koukeneko.hashi.service.DockerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/docker")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DockerController {

    private final DockerService dockerService;

    @GetMapping("/containers")
    public ResponseEntity<List<ContainerDTO>> listContainers() {
        return ResponseEntity.ok(dockerService.listContainers());
    }

    // 用法: POST /api/v1/docker/containers/{id}/start
    @PostMapping("/containers/{id}/start")
    public ResponseEntity<Void> startContainer(@PathVariable String id) {
        dockerService.startContainer(id);
        return ResponseEntity.ok().build();
    }

    // 用法: POST /api/v1/docker/containers/{id}/stop
    @PostMapping("/containers/{id}/stop")
    public ResponseEntity<Void> stopContainer(@PathVariable String id) {
        dockerService.stopContainer(id);
        return ResponseEntity.ok().build();
    }

    // 用法: POST /api/v1/docker/containers/{id}/restart
    @PostMapping("/containers/{id}/restart")
    public ResponseEntity<Void> restartContainer(@PathVariable String id) {
        dockerService.restartContainer(id);
        return ResponseEntity.ok().build();
    }
}
