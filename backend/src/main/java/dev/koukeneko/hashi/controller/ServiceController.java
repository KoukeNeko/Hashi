package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.ServiceItemDTO;
import dev.koukeneko.hashi.service.SystemdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiceController {

    private final SystemdService systemdService;

    @GetMapping
    public ResponseEntity<List<ServiceItemDTO>> listServices() {
        return ResponseEntity.ok(systemdService.listServices());
    }

    // POST /api/v1/services/nginx.service/restart
    @PostMapping("/{name}/{action}")
    public ResponseEntity<Void> controlService(
            @PathVariable String name,
            @PathVariable String action) {
        systemdService.controlService(name, action);
        return ResponseEntity.ok().build();
    }
}
