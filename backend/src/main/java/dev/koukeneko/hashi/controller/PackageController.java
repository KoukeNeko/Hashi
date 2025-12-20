package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.PackageInfoDTO;
import dev.koukeneko.hashi.service.PackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/packages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PackageController {

    private final PackageService packageService;

    /**
     * Search for packages in the repository
     */
    @GetMapping("/search")
    public ResponseEntity<List<PackageInfoDTO>> searchPackages(@RequestParam String q) {
        return ResponseEntity.ok(packageService.searchPackages(q));
    }

    /**
     * List available updates
     */
    @GetMapping("/updates")
    public ResponseEntity<List<PackageInfoDTO>> listUpdates() {
        return ResponseEntity.ok(packageService.listUpdates());
    }

    /**
     * List all installed packages
     */
    @GetMapping("/installed")
    public ResponseEntity<List<PackageInfoDTO>> listInstalled() {
        return ResponseEntity.ok(packageService.listInstalled());
    }

    /**
     * Install a package
     */
    @PostMapping("/install")
    public ResponseEntity<Map<String, Object>> installPackage(@RequestParam String name) {
        boolean success = packageService.installPackage(name);
        return buildResponse(success, "Package install started/completed", "Failed to install package");
    }

    /**
     * Remove a package
     */
    @PostMapping("/remove")
    public ResponseEntity<Map<String, Object>> removePackage(@RequestParam String name) {
        boolean success = packageService.removePackage(name);
        return buildResponse(success, "Package removed successfully", "Failed to remove package");
    }

    /**
     * Upgrade a specific package or all packages (if name not provided? No,
     * specific for now)
     */
    @PostMapping("/upgrade")
    public ResponseEntity<Map<String, Object>> upgradePackage(@RequestParam String name) {
        boolean success = packageService.upgradePackage(name);
        return buildResponse(success, "Package upgraded successfully", "Failed to upgrade package");
    }

    /**
     * Update package cache (apt update)
     */
    @PostMapping("/cache/update")
    public ResponseEntity<Map<String, Object>> updateCache() {
        boolean success = packageService.updateCache();
        return buildResponse(success, "Package cache updated", "Failed to update package cache");
    }

    // Helper for response
    private ResponseEntity<Map<String, Object>> buildResponse(boolean success, String successMsg, String failMsg) {
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? successMsg : failMsg));
    }
}
