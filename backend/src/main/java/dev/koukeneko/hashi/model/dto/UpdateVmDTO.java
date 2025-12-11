package dev.koukeneko.hashi.model.dto;

import lombok.Builder;
import java.util.List;

/**
 * VM 更新請求 DTO
 * <p>
 * 注意：部分設定僅能在 VM 關機時修改
 * </p>
 */
@Builder
public record UpdateVmDTO(
        // === CPU 設定 (需要 VM 關機) ===
        /** vCPU 數量 */
        Integer vcpu,
        /** CPU 模式 (host-passthrough/host-model/custom) */
        String cpuMode,
        /** CPU 插槽數 */
        Integer cpuSockets,
        /** 每插槽核心數 */
        Integer cpuCores,
        /** 每核心執行緒數 */
        Integer cpuThreads,

        // === 記憶體設定 (部分可熱插拔) ===
        /** 記憶體 (MB) */
        Long memoryMB,
        /** 最大記憶體 (MB) */
        Long maxMemoryMB,
        /** 啟用大分頁 */
        Boolean hugepages,

        // === 描述 (可隨時修改) ===
        /** 描述/備註 */
        String description,

        // === 網路設定 (需要 VM 關機) ===
        /** 網路類型 (network/bridge/direct) */
        String networkType,
        /** 網路來源 (default/br0) */
        String networkSource,
        /** 網卡型號 (virtio/e1000/rtl8139) */
        String networkModel,
        /** MAC 地址 */
        String macAddress,

        // === 顯示設定 (需要 VM 關機) ===
        /** 顯示類型 (vnc/spice) */
        String graphicsType,
        /** 顯示埠號 (-1=自動) */
        Integer graphicsPort,
        /** 監聽地址 (0.0.0.0/127.0.0.1) */
        String graphicsListen,
        /** VNC/SPICE 密碼 */
        String graphicsPassword,
        /** 顯示卡型號 (qxl/virtio/vga/cirrus) */
        String videoModel,
        /** 顯示記憶體 (KB) */
        Integer videoVram,

        // === 開機設定 (需要 VM 關機) ===
        /** 開機順序 (cdrom/hd/network) */
        List<String> bootOrder,
        /** 啟用開機選單 */
        Boolean bootMenu,

        // === 電源管理 (可隨時修改) ===
        /** 關機動作 (destroy/restart/preserve) */
        String onPoweroff,
        /** 重啟動作 (restart/destroy) */
        String onReboot,
        /** 當機動作 (destroy/restart/preserve) */
        String onCrash,

        // === 進階功能 (需要 VM 關機) ===
        /** 啟用 ACPI */
        Boolean acpi,
        /** 啟用 APIC */
        Boolean apic,
        /** 隨主機啟動 */
        Boolean autostart,
        /** 時鐘偏移 (utc/localtime) */
        String clockOffset,

        // === CD-ROM (可熱插拔) ===
        /** ISO 映像路徑 (null = 不變, "" = 彈出) */
        String isoPath,

        // === 裝置 (需要 VM 關機) ===
        /** USB 控制器 */
        Boolean usb,
        /** USB 平板裝置 (改善滑鼠) */
        Boolean tablet,
        /** 串列埠 */
        Boolean serial,
        /** TPM 裝置 */
        Boolean tpm) {
}
