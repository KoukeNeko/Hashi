package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.ServiceItemDTO;
import dev.koukeneko.hashi.service.platform.service.ServiceManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系統服務 (Systemd/Service) 管理 Controller
 */
@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiceController {

    private final ServiceManager serviceManager;

    /**
     * 列出所有系統服務
     *
     * @return 服務項目列表
     */
    @GetMapping
    public ResponseEntity<List<ServiceItemDTO>> listServices() {
        return ResponseEntity.ok(serviceManager.listServices());
    }

    /**
     * 控制系統服務狀態
     *
     * @param name
     *            服務名稱 (如 nginx.service)
     * @param action
     *            動作 (start, stop, restart, enable, disable)
     * @return 成功或失敗訊息
     */
    @PostMapping("/{name}/{action}")
    public ResponseEntity<String> controlService(
            @PathVariable String name,
            @PathVariable String action) {
        try {
            serviceManager.controlService(name, action);
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
