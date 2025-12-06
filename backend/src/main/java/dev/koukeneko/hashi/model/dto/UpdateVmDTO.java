package dev.koukeneko.hashi.model.dto;

import lombok.Builder;
import java.util.List;

/**
 * DTO for updating VM configuration.
 * Note: Some settings can only be changed when VM is stopped.
 */
@Builder
public record UpdateVmDTO(
        // CPU 設定 (需要 VM 關機)
        Integer vcpu,               // vCPU 數量
        String cpuMode,             // CPU 模式 (host-passthrough/host-model/custom)
        Integer cpuSockets,         // CPU 插槽數
        Integer cpuCores,           // 每插槽核心數
        Integer cpuThreads,         // 每核心執行緒數

        // 記憶體設定 (部分可熱插拔)
        Long memoryMB,              // 記憶體 (MB)
        Long maxMemoryMB,           // 最大記憶體 (MB)
        Boolean hugepages,          // 啟用大分頁

        // 描述 (可隨時修改)
        String description,         // 描述/備註

        // 網路設定 (需要 VM 關機)
        String networkType,         // 網路類型 (network/bridge/direct)
        String networkSource,       // 網路來源 (default/br0)
        String networkModel,        // 網卡型號 (virtio/e1000/rtl8139)
        String macAddress,          // MAC 地址

        // 顯示設定 (需要 VM 關機)
        String graphicsType,        // 顯示類型 (vnc/spice)
        Integer graphicsPort,       // 顯示埠號 (-1=自動)
        String graphicsListen,      // 監聽地址 (0.0.0.0/127.0.0.1)
        String graphicsPassword,    // VNC/SPICE 密碼
        String videoModel,          // 顯示卡型號 (qxl/virtio/vga/cirrus)
        Integer videoVram,          // 顯示記憶體 (KB)

        // 開機設定 (需要 VM 關機)
        List<String> bootOrder,     // 開機順序 (cdrom/hd/network)
        Boolean bootMenu,           // 啟用開機選單

        // 電源管理 (可隨時修改)
        String onPoweroff,          // 關機動作 (destroy/restart/preserve)
        String onReboot,            // 重啟動作 (restart/destroy)
        String onCrash,             // 當機動作 (destroy/restart/preserve)

        // 進階功能 (需要 VM 關機)
        Boolean acpi,               // 啟用 ACPI
        Boolean apic,               // 啟用 APIC
        Boolean autostart,          // 隨主機啟動
        String clockOffset,         // 時鐘偏移 (utc/localtime)

        // CD-ROM (可熱插拔)
        String isoPath,             // ISO 映像路徑 (null = 不變, "" = 彈出)

        // 裝置 (需要 VM 關機)
        Boolean usb,                // USB 控制器
        Boolean tablet,             // USB 平板裝置 (改善滑鼠)
        Boolean serial,             // 串列埠
        Boolean tpm                 // TPM 裝置
) {}
