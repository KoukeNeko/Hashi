package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.SystemStatusDTO;
import dev.koukeneko.hashi.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 開發階段先允許所有來源，避免 React 連不上
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/status")
    public ResponseEntity<SystemStatusDTO> getStatus() {
        return ResponseEntity.ok(dashboardService.getSystemStatus());
    }
}
