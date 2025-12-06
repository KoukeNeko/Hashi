package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.CreateVmDTO;
import dev.koukeneko.hashi.model.dto.IsoFileDTO;
import dev.koukeneko.hashi.model.dto.UpdateVmDTO;
import dev.koukeneko.hashi.model.dto.VmDTO;
import dev.koukeneko.hashi.model.dto.VncInfoDTO;
import dev.koukeneko.hashi.service.VirtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/virt")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VirtController {

    private final VirtService virtService;

    // ==================== VM 管理 ====================
    
    @GetMapping("/vms")
    public ResponseEntity<List<VmDTO>> listVms() {
        return ResponseEntity.ok(virtService.listVms());
    }

    @GetMapping("/vms/{name}")
    public ResponseEntity<VmDTO> getVmDetails(@PathVariable String name) {
        return ResponseEntity.ok(virtService.getVmDetails(name));
    }

    @PostMapping("/vms")
    public ResponseEntity<VmDTO> createVm(@RequestBody CreateVmDTO request) {
        return ResponseEntity.ok(virtService.createVm(request));
    }

    @PutMapping("/vms/{name}")
    public ResponseEntity<VmDTO> updateVm(@PathVariable String name, @RequestBody UpdateVmDTO request) {
        return ResponseEntity.ok(virtService.updateVm(name, request));
    }

    @DeleteMapping("/vms/{name}")
    public ResponseEntity<Void> deleteVm(@PathVariable String name) {
        virtService.deleteVm(name);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/vms/{name}/{action}")
    public ResponseEntity<Void> controlVm(@PathVariable String name, @PathVariable String action) {
        virtService.controlVm(name, action);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/vms/{name}/vnc-info")
    public ResponseEntity<VncInfoDTO> getVncInfo(@PathVariable String name) {
        return ResponseEntity.ok(virtService.getVncInfo(name));
    }

    // ==================== ISO 管理 ====================
    
    @GetMapping("/iso")
    public ResponseEntity<List<IsoFileDTO>> listIsoFiles() {
        return ResponseEntity.ok(virtService.listIsoFiles());
    }

    @PostMapping("/iso")
    public ResponseEntity<IsoFileDTO> uploadIso(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(virtService.uploadIso(file));
    }

    @DeleteMapping("/iso/{filename}")
    public ResponseEntity<Void> deleteIso(@PathVariable String filename) {
        virtService.deleteIso(filename);
        return ResponseEntity.ok().build();
    }
}