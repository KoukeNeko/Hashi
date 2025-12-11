package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.*;
import dev.koukeneko.hashi.service.NginxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Nginx Web Server 管理 Controller 提供 Virtual Host、SSL 憑證管理與服務控制
 */
@RestController
@RequestMapping("/api/v1/nginx")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NginxController {

    private final NginxService nginxService;

    // ==================== 服務控制 ====================

    /**
     * 取得 Nginx 服務狀態
     *
     * @return 服務狀態
     */
    @GetMapping("/status")
    public ResponseEntity<NginxStatusDTO> getStatus() {
        return ResponseEntity.ok(nginxService.getStatus());
    }

    /**
     * 重載 Nginx 設定
     *
     * @return 重載結果
     */
    @PostMapping("/reload")
    public ResponseEntity<Map<String, Object>> reload() {
        boolean success = nginxService.reload();
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Nginx reloaded successfully" : "Failed to reload Nginx"));
    }

    /**
     * 測試 Nginx 設定語法
     *
     * @return 測試結果
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testConfig() {
        String result = nginxService.testConfig();
        boolean valid = result.contains("syntax is ok");
        return ResponseEntity.ok(Map.of(
                "valid", valid,
                "message", result));
    }

    // ==================== Virtual Host 管理 ====================

    /**
     * 列出所有 Virtual Hosts
     *
     * @return Host 列表
     */
    @GetMapping("/hosts")
    public ResponseEntity<List<NginxHostDTO>> listHosts() {
        return ResponseEntity.ok(nginxService.listHosts());
    }

    /**
     * 取得單一 Host 設定
     *
     * @param name
     *            設定檔名稱
     * @return Host 設定
     */
    @GetMapping("/hosts/{name}")
    public ResponseEntity<NginxHostDTO> getHost(@PathVariable String name) {
        NginxHostDTO host = nginxService.getHost(name);
        if (host != null) {
            return ResponseEntity.ok(host);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * 取得 Host 設定檔內容
     *
     * @param name
     *            設定檔名稱
     * @return 設定檔純文字
     */
    @GetMapping("/hosts/{name}/config")
    public ResponseEntity<String> getHostConfig(@PathVariable String name) {
        String config = nginxService.getHostConfig(name);
        if (config != null) {
            return ResponseEntity.ok(config);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * 建立新 Virtual Host
     *
     * @param request
     *            建立請求
     * @return 建立後的 Host 資訊
     */
    @PostMapping("/hosts")
    public ResponseEntity<NginxHostDTO> createHost(@RequestBody CreateNginxHostRequest request) {
        NginxHostDTO host = nginxService.createHost(request);
        if (host != null) {
            return ResponseEntity.ok(host);
        }
        return ResponseEntity.badRequest().build();
    }

    /**
     * 更新 Host 設定檔內容
     *
     * @param name
     *            設定檔名稱
     * @param request
     *            包含新設定檔內容
     * @return 更新結果
     */
    @PutMapping("/hosts/{name}/config")
    public ResponseEntity<Map<String, Object>> updateHostConfig(
            @PathVariable String name,
            @RequestBody Map<String, String> request) {
        String content = request.get("content");
        boolean success = nginxService.updateHostConfig(name, content);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Config updated" : "Failed to update config"));
    }

    /**
     * 刪除 Virtual Host
     *
     * @param name
     *            設定檔名稱
     * @return 刪除結果
     */
    @DeleteMapping("/hosts/{name}")
    public ResponseEntity<Map<String, Object>> deleteHost(@PathVariable String name) {
        boolean success = nginxService.deleteHost(name);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Host deleted" : "Failed to delete host"));
    }

    /**
     * 啟用 Virtual Host
     *
     * @param name
     *            設定檔名稱
     * @return 啟用結果
     */
    @PostMapping("/hosts/{name}/enable")
    public ResponseEntity<Map<String, Object>> enableHost(@PathVariable String name) {
        boolean success = nginxService.enableHost(name);
        if (success) {
            nginxService.reload();
        }
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Host enabled" : "Failed to enable host"));
    }

    /**
     * 停用 Virtual Host
     *
     * @param name
     *            設定檔名稱
     * @return 停用結果
     */
    @PostMapping("/hosts/{name}/disable")
    public ResponseEntity<Map<String, Object>> disableHost(@PathVariable String name) {
        boolean success = nginxService.disableHost(name);
        if (success) {
            nginxService.reload();
        }
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Host disabled" : "Failed to disable host"));
    }

    // ==================== SSL 憑證管理 ====================

    /**
     * 列出所有 SSL 憑證
     *
     * @return 憑證列表
     */
    @GetMapping("/ssl")
    public ResponseEntity<List<SslCertDTO>> listCertificates() {
        return ResponseEntity.ok(nginxService.listCertificates());
    }

    /**
     * 使用 Certbot 申請 SSL 憑證
     *
     * @param request
     *            包含 domain 和 email
     * @return 申請結果
     */
    @PostMapping("/ssl/certbot")
    public ResponseEntity<Map<String, Object>> requestCertbotCert(@RequestBody Map<String, String> request) {
        String domain = request.get("domain");
        String email = request.get("email");
        boolean success = nginxService.requestCertbotCert(domain, email);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Certificate issued successfully" : "Failed to issue certificate"));
    }

    /**
     * 使用 acme.sh 申請 SSL 憑證
     *
     * @param request
     *            包含 domain 和 email
     * @return 申請結果
     */
    @PostMapping("/ssl/acme")
    public ResponseEntity<Map<String, Object>> requestAcmeCert(@RequestBody Map<String, String> request) {
        String domain = request.get("domain");
        String email = request.get("email");
        boolean success = nginxService.requestAcmeCert(domain, email);
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Certificate issued successfully" : "Failed to issue certificate"));
    }
}
