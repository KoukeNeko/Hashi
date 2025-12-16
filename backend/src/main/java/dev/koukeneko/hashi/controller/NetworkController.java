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
}
