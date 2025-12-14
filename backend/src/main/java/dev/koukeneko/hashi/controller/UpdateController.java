package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.UpdateInfoDTO;
import dev.koukeneko.hashi.service.UpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 更新檢查 Controller
 * 提供版本資訊和更新檢查功能
 */
@RestController
@RequestMapping("/api/v1/update")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UpdateController {

    private final UpdateService updateService;

    /**
     * 獲取當前的更新資訊
     * 使用快取的資料以減少 API 請求
     *
     * @return 更新資訊 DTO
     */
    @GetMapping("/info")
    public ResponseEntity<UpdateInfoDTO> getUpdateInfo() {
        return ResponseEntity.ok(updateService.getUpdateInfo());
    }

    /**
     * 強制檢查更新
     * 忽略快取，直接查詢 GitHub Releases API
     *
     * @return 最新的更新資訊 DTO
     */
    @PostMapping("/check")
    public ResponseEntity<UpdateInfoDTO> checkForUpdates() {
        return ResponseEntity.ok(updateService.checkForUpdates());
    }
}
