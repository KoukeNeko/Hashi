package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.SystemDiskDTO;
import dev.koukeneko.hashi.service.DiskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/disks")
@RequiredArgsConstructor
@Slf4j
public class DiskController {

    private final DiskService diskService;

    @GetMapping
    public ResponseEntity<List<SystemDiskDTO>> listDisks() {
        return ResponseEntity.ok(diskService.listDisks());
    }

    @PostMapping("/mount")
    public ResponseEntity<?> mount(@RequestBody Map<String, String> request) {
        String source = request.get("source");
        String target = request.get("target");
        String fstype = request.get("fstype");
        String options = request.get("options");

        if (source == null || target == null) {
            return ResponseEntity.badRequest().body("Source and Target are required");
        }

        try {
            diskService.mount(source, target, fstype, options);
            return ResponseEntity.ok().body(Map.of("message", "Mounted successfully"));
        } catch (Exception e) {
            log.error("Mount failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/unmount")
    public ResponseEntity<?> unmount(@RequestBody Map<String, String> request) {
        String target = request.get("target");
        if (target == null) {
            return ResponseEntity.badRequest().body("Target is required");
        }

        try {
            diskService.unmount(target);
            return ResponseEntity.ok().body(Map.of("message", "Unmounted successfully"));
        } catch (Exception e) {
            log.error("Unmount failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/format")
    public ResponseEntity<?> format(@RequestBody Map<String, String> request) {
        String device = request.get("device");
        String fstype = request.get("fstype");
        String label = request.get("label");
        String confirmation = request.get("confirmation");

        if (device == null || fstype == null) {
            return ResponseEntity.badRequest().body("Device and FSType are required");
        }

        if (!"FORMAT".equals(confirmation)) {
            return ResponseEntity.badRequest().body("Confirmation 'FORMAT' is required");
        }

        try {
            diskService.format(device, fstype, label);
            return ResponseEntity.ok().body(Map.of("message", "Format started successfully"));
        } catch (Exception e) {
            log.error("Format failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
