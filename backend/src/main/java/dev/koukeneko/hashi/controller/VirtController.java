package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.CreateVmDTO;
import dev.koukeneko.hashi.model.dto.IsoFileDTO;
import dev.koukeneko.hashi.model.dto.UpdateVmDTO;
import dev.koukeneko.hashi.model.dto.VmDTO;
import dev.koukeneko.hashi.model.dto.VncInfoDTO;
import dev.koukeneko.hashi.service.VirtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 虛擬化 (VM) 管理 Controller 提供 VM 的生命週期管理 (增刪改查、控制) 以及 ISO 檔案管理
 */
@RestController
@RequestMapping("/api/v1/virt")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VirtController {

    private final VirtService virtService;

    // ==================== VM 管理 ====================

    /**
     * 列出所有 VM
     *
     * @return VM 列表
     */
    @GetMapping("/vms")
    public ResponseEntity<List<VmDTO>> listVms() {
        return ResponseEntity.ok(virtService.listVms());
    }

    /**
     * 取得特定 VM 詳細資訊
     *
     * @param name
     *            VM 名稱
     * @return VM 詳細資訊
     */
    @GetMapping("/vms/{name}")
    public ResponseEntity<VmDTO> getVmDetails(@PathVariable String name) {
        return ResponseEntity.ok(virtService.getVmDetails(name));
    }

    /**
     * 建立新 VM
     *
     * @param request
     *            VM 建立請求參數
     * @return 建立後的 VM 資訊
     */
    @PostMapping("/vms")
    public ResponseEntity<VmDTO> createVm(@RequestBody CreateVmDTO request) {
        return ResponseEntity.ok(virtService.createVm(request));
    }

    /**
     * 更新 VM 設定
     *
     * @param name
     *            VM 名稱
     * @param request
     *            更新請求參數
     * @return 更新後的 VM 資訊
     */
    @PutMapping("/vms/{name}")
    public ResponseEntity<VmDTO> updateVm(@PathVariable String name, @RequestBody UpdateVmDTO request) {
        return ResponseEntity.ok(virtService.updateVm(name, request));
    }

    /**
     * 刪除 VM
     *
     * @param name
     *            VM 名稱
     * @return 成功回傳 200 OK
     */
    @DeleteMapping("/vms/{name}")
    public ResponseEntity<Void> deleteVm(@PathVariable String name) {
        virtService.deleteVm(name);
        return ResponseEntity.ok().build();
    }

    /**
     * 控制 VM 狀態
     *
     * @param name
     *            VM 名稱
     * @param action
     *            動作 (start, shutdown, destroy, reboot, suspend, resume)
     * @return 成功回傳 200 OK
     */
    @PostMapping("/vms/{name}/{action}")
    public ResponseEntity<Void> controlVm(@PathVariable String name, @PathVariable String action) {
        virtService.controlVm(name, action);
        return ResponseEntity.ok().build();
    }

    /**
     * 取得 VM 的 VNC 連線資訊
     *
     * @param name
     *            VM 名稱
     * @return VNC 資訊
     */
    @GetMapping("/vms/{name}/vnc-info")
    public ResponseEntity<VncInfoDTO> getVncInfo(@PathVariable String name) {
        return ResponseEntity.ok(virtService.getVncInfo(name));
    }

    // ==================== ISO 管理 ====================

    /**
     * 列出所有可用的 ISO 檔案
     *
     * @return ISO 檔案列表
     */
    @GetMapping("/iso")
    public ResponseEntity<List<IsoFileDTO>> listIsoFiles() {
        return ResponseEntity.ok(virtService.listIsoFiles());
    }

    /**
     * 上傳 ISO 檔案
     *
     * @param file
     *            檔案
     * @return 上傳後的 ISO 檔案資訊
     */
    @PostMapping("/iso")
    public ResponseEntity<IsoFileDTO> uploadIso(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(virtService.uploadIso(file));
    }

    /**
     * 刪除 ISO 檔案
     *
     * @param filename
     *            檔案名稱
     * @return 成功回傳 200 OK
     */
    @DeleteMapping("/iso/{filename}")
    public ResponseEntity<Void> deleteIso(@PathVariable String filename) {
        virtService.deleteIso(filename);
        return ResponseEntity.ok().build();
    }
}
