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
    public ResponseEntity<String> controlService(
            @PathVariable String name,
            @PathVariable String action) {
        try {
            systemdService.controlService(name, action);
            return ResponseEntity.ok("Success");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            // 檢查是否為權限問題
            String msg = e.getMessage();
            if (msg != null && (msg.contains("Permission denied") || msg.contains("Access denied") || 
                msg.contains("authentication") || msg.contains("privilege"))) {
                return ResponseEntity.status(403).body("Permission denied. Run backend as root or configure sudo.");
            }
            return ResponseEntity.internalServerError().body(msg != null ? msg : "Failed to control service");
        }
    }
}
