package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.service.platform.PlatformDetector;
import dev.koukeneko.hashi.service.platform.PlatformType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 平台資訊 API
 * 讓前端知道後端運行在哪個作業系統
 */
@RestController
@RequestMapping("/api/v1/platform")
@CrossOrigin(origins = "*")
public class PlatformController {

    /**
     * 取得目前平台資訊
     * 
     * 回傳範例：
     * {
     * "platform": "LINUX",
     * "osName": "Linux",
     * "osVersion": "5.15.0-generic",
     * "osArch": "amd64"
     * }
     */
    @GetMapping
    public ResponseEntity<Map<String, String>> getPlatformInfo() {
        PlatformType platform = PlatformDetector.detect();

        return ResponseEntity.ok(Map.of(
                "platform", platform.name(),
                "osName", System.getProperty("os.name"),
                "osVersion", System.getProperty("os.version"),
                "osArch", System.getProperty("os.arch")));
    }

    /**
     * 取得支援的功能清單
     * 前端可根據此資訊顯示/隱藏特定功能
     */
    @GetMapping("/features")
    public ResponseEntity<Map<String, Boolean>> getSupportedFeatures() {
        PlatformType platform = PlatformDetector.detect();
        boolean isLinux = platform == PlatformType.LINUX;
        boolean isWindows = platform == PlatformType.WINDOWS;

        return ResponseEntity.ok(Map.of(
                "serviceManager", isLinux || isWindows,
                "ufwFirewall", isLinux,
                "iptables", isLinux,
                "windowsFirewall", isWindows,
                "scheduler", isLinux || isWindows,
                "terminal", isLinux || isWindows,
                "logStream", isLinux || isWindows,
                "userManagement", isLinux || isWindows));
    }
}
