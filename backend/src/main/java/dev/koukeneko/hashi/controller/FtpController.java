package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.CreateFtpUserRequest;
import dev.koukeneko.hashi.model.dto.FtpServerInfo;
import dev.koukeneko.hashi.model.dto.FtpUserDTO;
import dev.koukeneko.hashi.service.FtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FTP Server 管理 REST API
 * 支援 vsftpd, proftpd, pure-ftpd
 */
@RestController
@RequestMapping("/api/v1/ftp")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FtpController {

    private final FtpService ftpService;

    // ==================== Server Detection ====================

    /**
     * 偵測已安裝的 FTP servers
     */
    @GetMapping("/servers")
    public ResponseEntity<List<FtpServerInfo>> detectServers() {
        return ResponseEntity.ok(ftpService.detectServers());
    }

    // ==================== Status Control ====================

    /**
     * 取得指定 FTP server 狀態
     */
    @GetMapping("/{type}/status")
    public ResponseEntity<FtpServerInfo> getStatus(@PathVariable String type) {
        return ResponseEntity.ok(ftpService.getStatus(type));
    }

    /**
     * 啟用/停用 FTP server
     */
    @PostMapping("/{type}/status")
    public ResponseEntity<Void> setStatus(
            @PathVariable String type,
            @RequestParam boolean enabled) {
        ftpService.setEnabled(type, enabled);
        return ResponseEntity.ok().build();
    }

    // ==================== Config ====================

    /**
     * 取得設定檔內容
     */
    @GetMapping("/{type}/config")
    public ResponseEntity<Map<String, String>> getConfig(@PathVariable String type) {
        String content = ftpService.getConfig(type);
        return ResponseEntity.ok(Map.of("content", content));
    }

    /**
     * 更新設定檔內容
     */
    @PutMapping("/{type}/config")
    public ResponseEntity<Void> updateConfig(
            @PathVariable String type,
            @RequestBody Map<String, String> body) {
        String content = body.get("content");
        if (content == null) {
            return ResponseEntity.badRequest().build();
        }
        ftpService.updateConfig(type, content);
        return ResponseEntity.ok().build();
    }

    // ==================== User Management ====================

    /**
     * 列出 FTP 使用者
     */
    @GetMapping("/{type}/users")
    public ResponseEntity<List<FtpUserDTO>> listUsers(@PathVariable String type) {
        return ResponseEntity.ok(ftpService.listUsers(type));
    }

    /**
     * 新增 FTP 使用者
     */
    @PostMapping("/{type}/users")
    public ResponseEntity<Void> addUser(
            @PathVariable String type,
            @RequestBody CreateFtpUserRequest request) {
        ftpService.addUser(type, request);
        return ResponseEntity.ok().build();
    }

    /**
     * 刪除 FTP 使用者
     */
    @DeleteMapping("/{type}/users/{username}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String type,
            @PathVariable String username) {
        ftpService.deleteUser(type, username);
        return ResponseEntity.ok().build();
    }

    // ==================== Logs ====================

    /**
     * 取得 FTP 日誌
     */
    @GetMapping("/{type}/logs")
    public ResponseEntity<List<String>> getLogs(
            @PathVariable String type,
            @RequestParam(defaultValue = "100") int lines) {
        return ResponseEntity.ok(ftpService.getLogs(type, lines));
    }
}
