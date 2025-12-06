package dev.koukeneko.hashi.model.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record VmDTO(
        int id,                     // 執行中的 ID (關機時為 -1)
        String uuid,                // 唯一識別碼
        String name,                // 名稱 (e.g. "win10-lab")
        String state,               // 狀態 (Running, Paused, Shutoff)
        int vcpu,                   // CPU 核心數
        long memory,                // 記憶體 (Bytes)
        long maxMemory,             // 最大分配記憶體
        
        // 詳細設定 (由 getVmDetails 填充)
        String description,         // 描述
        String cpuMode,             // CPU 模式
        Integer cpuSockets,         // CPU 插槽數
        Integer cpuCores,           // 每插槽核心數
        Integer cpuThreads,         // 每核心執行緒數
        Boolean hugepages,          // 大分頁
        String diskPath,            // 磁碟路徑
        String diskFormat,          // 磁碟格式
        String diskBus,             // 磁碟匯流排
        Long diskSizeBytes,         // 磁碟大小
        String networkType,         // 網路類型
        String networkSource,       // 網路來源
        String networkModel,        // 網卡型號
        String macAddress,          // MAC 地址
        String graphicsType,        // 顯示類型
        Integer graphicsPort,       // 顯示埠號
        String graphicsListen,      // 監聽地址
        String videoModel,          // 顯示卡型號
        Integer videoVram,          // 顯示記憶體
        List<String> bootOrder,     // 開機順序
        Boolean bootMenu,           // 開機選單
        Boolean uefi,               // UEFI 開機
        String osType,              // 作業系統類型
        String machine,             // 機器類型
        String onPoweroff,          // 關機動作
        String onReboot,            // 重啟動作
        String onCrash,             // 當機動作
        Boolean acpi,               // ACPI
        Boolean apic,               // APIC
        Boolean autostart,          // 自動啟動
        String clockOffset,         // 時鐘偏移
        String isoPath,             // 當前掛載的 ISO
        Boolean usb,                // USB 控制器
        Boolean tablet,             // USB 平板
        Boolean serial,             // 串列埠
        Boolean tpm                 // TPM
) {}