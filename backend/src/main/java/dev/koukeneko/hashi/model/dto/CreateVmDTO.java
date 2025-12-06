package dev.koukeneko.hashi.model.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record CreateVmDTO(
        // 基本設定
        String name,            // VM 名稱 (e.g. "ubuntu-server")
        String description,     // 描述/備註

        // CPU 設定
        int vcpu,               // vCPU 數量
        String cpuMode,         // CPU 模式 (host-passthrough/host-model/custom)
        Integer cpuSockets,     // CPU 插槽數
        Integer cpuCores,       // 每插槽核心數
        Integer cpuThreads,     // 每核心執行緒數

        // 記憶體設定
        long memoryMB,          // 記憶體 (MB)
        Long maxMemoryMB,       // 最大記憶體 (MB)
        Boolean hugepages,      // 啟用大分頁

        // 主磁碟設定 (向後相容)
        Long diskGB,            // 磁碟大小 (GB) - 可選，使用 disks 時可省略
        String diskFormat,      // 磁碟格式 (qcow2/raw)
        String diskBus,         // 磁碟匯流排 (virtio/sata/scsi/ide)
        String diskCache,       // 快取模式 (none/writeback/writethrough)
        String diskIo,          // I/O 模式 (native/threads)

        // 多磁碟設定
        List<DiskDTO> disks,    // 額外磁碟列表

        // 網路設定
        String networkType,     // 網路類型 (network/bridge/direct)
        String networkSource,   // 網路來源 (default/br0)
        String networkModel,    // 網卡型號 (virtio/e1000/rtl8139)
        String macAddress,      // MAC 地址

        // 顯示設定
        String graphicsType,    // 顯示類型 (vnc/spice)
        Integer graphicsPort,   // 顯示埠號 (-1=自動)
        String graphicsListen,  // 監聽地址 (0.0.0.0/127.0.0.1)
        String graphicsPassword,// VNC/SPICE 密碼
        String videoModel,      // 顯示卡型號 (qxl/virtio/vga/cirrus)
        Integer videoVram,      // 顯示記憶體 (KB)

        // 開機設定
        List<String> bootOrder, // 開機順序 (cdrom/hd/network)
        Boolean bootMenu,       // 啟用開機選單
        Boolean uefi,           // UEFI 開機
        Boolean secureBoot,     // 安全開機

        // 系統設定
        String isoPath,         // ISO 映像路徑
        String osType,          // 作業系統類型 (linux/windows)
        String osVariant,       // 作業系統變體 (ubuntu22.04/win11)
        String machine,         // 機器類型 (pc-i440fx/pc-q35)
        String arch,            // 架構 (x86_64/aarch64)

        // 電源管理
        String onPoweroff,      // 關機動作 (destroy/restart/preserve)
        String onReboot,        // 重啟動作 (restart/destroy)
        String onCrash,         // 當機動作 (destroy/restart/preserve)

        // 進階功能
        Boolean acpi,           // 啟用 ACPI
        Boolean apic,           // 啟用 APIC
        Boolean autostart,      // 隨主機啟動
        String clockOffset,     // 時鐘偏移 (utc/localtime)

        // 裝置
        Boolean usb,            // USB 控制器
        Boolean tablet,         // USB 平板裝置 (改善滑鼠)
        Boolean serial,         // 串列埠
        Boolean tpm             // TPM 裝置
) {
    // 提供預設值的靜態工廠方法
    public static CreateVmDTO withDefaults(String name, int vcpu, long memoryMB, long diskGB, String isoPath) {
        return CreateVmDTO.builder()
                .name(name)
                .vcpu(vcpu)
                .memoryMB(memoryMB)
                .diskGB(diskGB)
                .isoPath(isoPath)
                .osType("linux")
                .cpuMode("host-passthrough")
                .diskFormat("qcow2")
                .diskBus("virtio")
                .diskCache("none")
                .networkType("network")
                .networkSource("default")
                .networkModel("virtio")
                .graphicsType("vnc")
                .graphicsPort(-1)
                .graphicsListen("0.0.0.0")
                .videoModel("qxl")
                .videoVram(65536)
                .bootOrder(List.of("cdrom", "hd"))
                .machine("pc-q35")
                .arch("x86_64")
                .onPoweroff("destroy")
                .onReboot("restart")
                .onCrash("destroy")
                .acpi(true)
                .apic(true)
                .autostart(false)
                .clockOffset("utc")
                .usb(true)
                .tablet(true)
                .serial(true)
                .build();
    }
}
