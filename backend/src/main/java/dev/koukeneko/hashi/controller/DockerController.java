package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.ContainerDTO;
import dev.koukeneko.hashi.service.DockerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
