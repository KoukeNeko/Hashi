package dev.koukeneko.hashi.model.dto;

import lombok.Builder;
import java.util.List;

/**
 * VM 資訊 DTO
 */
@Builder
public record VmDTO(
        /** 執行中的 ID (關機時為 -1) */
        int id,
        /** 唯一識別碼 */
        String uuid,
        /** 名稱 (e.g. "win10-lab") */
        String name,
        /** 狀態 (Running, Paused, Shutoff) */
        String state,
        /** CPU 核心數 */
        int vcpu,
        /** 記憶體 (Bytes) */
        long memory,
        /** 最大分配記憶體 */
        long maxMemory,

        // === 詳細設定 (由 getVmDetails 填充) ===
        /** 描述 */
        String description,
        /** CPU 模式 */
        String cpuMode,
        /** CPU 插槽數 */
        Integer cpuSockets,
        /** 每插槽核心數 */
        Integer cpuCores,
        /** 每核心執行緒數 */
        Integer cpuThreads,
        /** 大分頁 */
        Boolean hugepages,

        // === 主磁碟 (向後相容) ===
        /** 磁碟路徑 */
        String diskPath,
        /** 磁碟格式 */
        String diskFormat,
        /** 磁碟匯流排 */
        String diskBus,
        /** 磁碟大小 */
        Long diskSizeBytes,

        // === 多磁碟 ===
        /** 所有磁碟列表 */
        List<DiskDTO> disks,

        /** 網路類型 */
        String networkType,
        /** 網路來源 */
        String networkSource,
        /** 網卡型號 */
        String networkModel,
        /** MAC 地址 */
        String macAddress,
        /** 顯示類型 */
        String graphicsType,
        /** 顯示埠號 */
        Integer graphicsPort,
        /** 監聽地址 */
        String graphicsListen,
        /** 顯示卡型號 */
        String videoModel,
        /** 顯示記憶體 */
        Integer videoVram,
        /** 開機順序 */
        List<String> bootOrder,
        /** 開機選單 */
        Boolean bootMenu,
        /** UEFI 開機 */
        Boolean uefi,
        /** 作業系統類型 */
        String osType,
        /** 機器類型 */
        String machine,
        /** 關機動作 */
        String onPoweroff,
        /** 重啟動作 */
        String onReboot,
        /** 當機動作 */
        String onCrash,
        /** ACPI */
        Boolean acpi,
        /** APIC */
        Boolean apic,
        /** 自動啟動 */
        Boolean autostart,
        /** 時鐘偏移 */
        String clockOffset,
        /** 目前掛載的 ISO */
        String isoPath,
        /** USB 控制器 */
        Boolean usb,
        /** USB 平板 */
        Boolean tablet,
        /** 串列埠 */
        Boolean serial,
        /** TPM */
        Boolean tpm) {
}
