package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.CreateVmDTO;
import dev.koukeneko.hashi.model.dto.VmDTO;
import dev.koukeneko.hashi.service.VirtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/virt")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VirtController {

    private final VirtService virtService;

    @GetMapping("/vms")
    public ResponseEntity<List<VmDTO>> listVms() {
        return ResponseEntity.ok(virtService.listVms());
    }

    @PostMapping("/vms")
    public ResponseEntity<VmDTO> createVm(@RequestBody CreateVmDTO request) {
        return ResponseEntity.ok(virtService.createVm(request));
    }

    @DeleteMapping("/vms/{name}")
    public ResponseEntity<Void> deleteVm(@PathVariable String name) {
        virtService.deleteVm(name);
        return ResponseEntity.ok().build();
    }

    // POST /api/v1/virt/vms/win10/start
    @PostMapping("/vms/{name}/{action}")
    public ResponseEntity<Void> controlVm(@PathVariable String name, @PathVariable String action) {
        virtService.controlVm(name, action);
        return ResponseEntity.ok().build();
    }
}