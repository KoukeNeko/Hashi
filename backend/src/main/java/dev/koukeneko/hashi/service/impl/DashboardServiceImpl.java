package dev.koukeneko.hashi.service.impl;

import dev.koukeneko.hashi.model.dto.SystemStatusDTO;
import dev.koukeneko.hashi.model.dto.SystemStatusDTO.InterfaceStat;
import dev.koukeneko.hashi.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.NetworkIF;
import oshi.software.os.OperatingSystem;
import oshi.software.os.FileSystem;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final SystemInfo systemInfo;

    @Override
    public SystemStatusDTO getSystemStatus() {
        HardwareAbstractionLayer hardware = systemInfo.getHardware();
        OperatingSystem os = systemInfo.getOperatingSystem();
        GlobalMemory memory = hardware.getMemory();
        CentralProcessor processor = hardware.getProcessor();
        List<NetworkIF> networkIFs = hardware.getNetworkIFs();

        // 1. [Snapshot 1] 記錄起始狀態 (CPU ticks & Network bytes)
        long[] prevTicks = processor.getSystemCpuLoadTicks();
        long prevRecv = 0;
        long prevSent = 0;
        for (NetworkIF net : networkIFs) {
            net.updateAttributes(); // 必須更新才能拿到最新數據
            prevRecv += net.getBytesRecv();
            prevSent += net.getBytesSent();
        }

        // 2. [Wait] 等待取樣時間 (300ms)
        try {
            TimeUnit.MILLISECONDS.sleep(300);
        } catch (InterruptedException e) {
        }

        // 3. [Snapshot 2] 記錄結束狀態並計算差值
        double cpuUsage = processor.getSystemCpuLoadBetweenTicks(prevTicks) * 100;

        long currRecv = 0;
        long currSent = 0;
        List<InterfaceStat> ifaceStats = new java.util.ArrayList<>();

        for (NetworkIF net : networkIFs) {
            long startRecv = net.getBytesRecv();
            long startSent = net.getBytesSent();

            net.updateAttributes();

            long endRecv = net.getBytesRecv();
            long endSent = net.getBytesSent();

            long ifaceDownloadSpeed = (long) ((endRecv - startRecv) * (1000.0 / 300.0));
            long ifaceUploadSpeed = (long) ((endSent - startSent) * (1000.0 / 300.0));

            // Accumulate global stats
            currRecv += endRecv;
            currSent += endSent;

            ifaceStats.add(InterfaceStat.builder()
                    .name(net.getName())
                    .downloadRate(ifaceDownloadSpeed)
                    .uploadRate(ifaceUploadSpeed)
                    .totalRecv(endRecv)
                    .totalSent(endSent)
                    .build());
        }

        // Global rates (sum of interfaces) - Re-calculating correctly based on
        // accumulated totals might be tricky due to timing,
        // but summing up the individual rates is a reasonable approximation for
        // display.
        long downloadSpeed = interfaceStats.stream().mapToLong(SystemStatusDTO.NetworkInfo.InterfaceStat::downloadRate)
                .sum();
        long uploadSpeed = interfaceStats.stream().mapToLong(SystemStatusDTO.NetworkInfo.InterfaceStat::uploadRate)
                .sum();

        // 4. [Disk] 獲取磁碟資訊
        FileSystem fileSystem = os.getFileSystem();
        List<SystemStatusDTO.DiskInfo> diskInfos = fileSystem.getFileStores().stream()
                // 過濾掉一些虛擬磁碟 (tmpfs, overlay)，只看實體硬碟
                // TODO: 應該可以不用過濾1GB以下的，改成過濾掉 tmpfs 就好
                .filter(store -> store.getTotalSpace() > 1024 * 1024 * 1024L) // 只顯示大於 1GB 的
                .map(store -> SystemStatusDTO.DiskInfo.builder()
                        .name(store.getName())
                        .mount(store.getMount())
                        .totalSpace(store.getTotalSpace())
                        .usableSpace(store.getUsableSpace())
                        .usedSpace(store.getTotalSpace() - store.getUsableSpace())
                        .build())
                .collect(Collectors.toList());

        // 5. [Memory]
        long totalMem = memory.getTotal();
        long usedMem = totalMem - memory.getAvailable();

        return SystemStatusDTO.builder()
                .cpuUsage(round(cpuUsage))
                .coreCount(processor.getLogicalProcessorCount())
                .totalMemory(totalMem)
                .usedMemory(usedMem)
                .memoryUsage(round(((double) usedMem / totalMem) * 100))
                .osName(os.toString())
                .systemLoad(processor.getSystemLoadAverage(1)[0])
                .disks(diskInfos) // 加入硬碟
                .network(SystemStatusDTO.NetworkInfo.builder() // 加入網路
                        .downloadRate(downloadSpeed)
                        .uploadRate(uploadSpeed)
                        .totalRecv(currRecv)
                        .totalSent(currSent)
                        .build())
                .build();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
