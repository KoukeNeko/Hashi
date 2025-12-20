package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.StoragePoolDTO;
import dev.koukeneko.hashi.model.dto.request.CreatePoolRequest;
import dev.koukeneko.hashi.service.StoragePoolService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 儲存池管理 REST API
 * 支援 mdadm RAID 陣列管理 (未來支援 ZFS)
 */
@RestController
@RequestMapping("/api/v1/storage")
@RequiredArgsConstructor
@Slf4j
public class StorageController {

    private final StoragePoolService storagePoolService;

    /**
     * 取得儲存提供者資訊
     */
    @GetMapping("/provider")
    public ResponseEntity<Map<String, String>> getProvider() {
        return ResponseEntity.ok(Map.of(
                "name", storagePoolService.getProviderName()));
    }

    /**
     * 列出所有儲存池/陣列
     */
    @GetMapping("/pools")
    public ResponseEntity<List<StoragePoolDTO>> listPools() {
        return ResponseEntity.ok(storagePoolService.listPools());
    }

    /**
     * 取得單一儲存池詳情
     */
    @GetMapping("/pools/{name}")
    public ResponseEntity<?> getPool(@PathVariable String name) {
        StoragePoolDTO pool = storagePoolService.getPool(name);
        if (pool == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(pool);
    }

    /**
     * 建立新儲存池
     */
    @PostMapping("/pools")
    public ResponseEntity<?> createPool(@Valid @RequestBody CreatePoolRequest request) {
        try {
            storagePoolService.createPool(request);
            return ResponseEntity.ok(Map.of(
                    "message", "儲存池建立成功",
                    "pool", "/dev/" + request.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("建立儲存池失敗", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 刪除儲存池
     */
    @DeleteMapping("/pools/{name}")
    public ResponseEntity<?> destroyPool(
            @PathVariable String name,
            @RequestParam(required = false) String confirmation) {

        if (!"DESTROY".equals(confirmation)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "請提供 confirmation=DESTROY 參數以確認刪除"));
        }

        try {
            storagePoolService.destroyPool(name);
            return ResponseEntity.ok(Map.of("message", "儲存池已刪除"));
        } catch (Exception e) {
            log.error("刪除儲存池失敗", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 新增磁碟到儲存池
     */
    @PostMapping("/pools/{name}/disks")
    public ResponseEntity<?> addDisk(
            @PathVariable String name,
            @RequestBody Map<String, String> request) {

        String disk = request.get("disk");
        if (disk == null || disk.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "disk 參數為必填"));
        }

        try {
            storagePoolService.addDisk(name, disk);
            return ResponseEntity.ok(Map.of("message", "磁碟已新增至儲存池"));
        } catch (Exception e) {
            log.error("新增磁碟失敗", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 從儲存池移除磁碟
     */
    @DeleteMapping("/pools/{name}/disks/{disk}")
    public ResponseEntity<?> removeDisk(
            @PathVariable String name,
            @PathVariable String disk) {
        try {
            storagePoolService.removeDisk(name, "/dev/" + disk);
            return ResponseEntity.ok(Map.of("message", "磁碟已從儲存池移除"));
        } catch (Exception e) {
            log.error("移除磁碟失敗", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 標記磁碟為故障
     */
    @PostMapping("/pools/{name}/disks/{disk}/fail")
    public ResponseEntity<?> markDiskFaulty(
            @PathVariable String name,
            @PathVariable String disk) {
        try {
            storagePoolService.markDiskFaulty(name, "/dev/" + disk);
            return ResponseEntity.ok(Map.of("message", "磁碟已標記為故障"));
        } catch (Exception e) {
            log.error("標記磁碟故障失敗", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== S.M.A.R.T. 健康監測 ====================

    private final dev.koukeneko.hashi.service.SmartService smartService;

    /**
     * 取得單一磁碟健康資訊
     */
    @GetMapping("/smart")
    public ResponseEntity<?> getDiskHealth(@RequestParam String device) {
        try {
            return ResponseEntity.ok(smartService.getHealth(device));
        } catch (Exception e) {
            log.error("取得磁碟健康資訊失敗", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 列出所有磁碟健康狀態
     */
    @GetMapping("/smart/all")
    public ResponseEntity<?> listAllDiskHealth() {
        try {
            return ResponseEntity.ok(smartService.listAllHealth());
        } catch (Exception e) {
            log.error("取得所有磁碟健康資訊失敗", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 執行 S.M.A.R.T. 測試
     */
    @PostMapping("/smart/test")
    public ResponseEntity<?> runSmartTest(
            @RequestParam String device,
            @RequestParam String testType) {
        try {
            smartService.runTest(device, testType);
            return ResponseEntity.ok(Map.of("message", "已啟動 S.M.A.R.T. 測試"));
        } catch (Exception e) {
            log.error("執行 S.M.A.R.T. 測試失敗", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
