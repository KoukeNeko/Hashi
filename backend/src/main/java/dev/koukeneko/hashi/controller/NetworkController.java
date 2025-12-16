package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.NetworkInterfaceDTO;
import dev.koukeneko.hashi.service.NetworkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/network")
@RequiredArgsConstructor
@Slf4j
public class NetworkController {

    private final NetworkService networkService;

    @GetMapping("/interfaces")
    public ResponseEntity<List<NetworkInterfaceDTO>> listInterfaces() {
        return ResponseEntity.ok(networkService.listInterfaces());
    }

    @GetMapping("/dns")
    public ResponseEntity<List<String>> getDnsConfig() {
        return ResponseEntity.ok(networkService.getDnsConfig());
    }

    @org.springframework.web.bind.annotation.PostMapping("/dns")
    public ResponseEntity<?> updateDnsConfig(
            @org.springframework.web.bind.annotation.RequestBody List<String> nameservers) {
        try {
            networkService.updateDnsConfig(nameservers);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to update DNS", e);
            return ResponseEntity.internalServerError().body("Failed to update DNS: " + e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.PostMapping("/interfaces/{name}/config")
    public ResponseEntity<?> configureInterface(
            @org.springframework.web.bind.annotation.PathVariable String name,
            @org.springframework.web.bind.annotation.RequestBody dev.koukeneko.hashi.model.dto.NetworkConfigDTO config) {
        try {
            networkService.configureInterface(name, config.getIpv4Method(), config.getIpAddress(), config.getGateway());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to configure interface " + name, e);
            return ResponseEntity.internalServerError().body("Failed to configure interface: " + e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.PostMapping("/interfaces/{name}/state")
    public ResponseEntity<?> setInterfaceState(
            @org.springframework.web.bind.annotation.PathVariable String name,
            @org.springframework.web.bind.annotation.RequestParam String state) {
        try {
            networkService.setInterfaceState(name, state);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to set interface state " + name, e);
            return ResponseEntity.internalServerError().body("Failed to set interface state: " + e.getMessage());
        }
    }
}
