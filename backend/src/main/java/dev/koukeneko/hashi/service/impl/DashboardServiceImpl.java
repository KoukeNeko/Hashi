package dev.koukeneko.hashi.service.impl;

import dev.koukeneko.hashi.model.dto.SystemStatusDTO;
import dev.koukeneko.hashi.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    // 直接初始化 SystemInfo，作為 Singleton Bean 的一部分長駐記憶體
    private final SystemInfo systemInfo = new SystemInfo();

    @Override
    public SystemStatusDTO getSystemStatus() {
        HardwareAbstractionLayer hardware = systemInfo.getHardware();
        GlobalMemory memory = hardware.getMemory();
        CentralProcessor processor = hardware.getProcessor();

        // 1. 計算 CPU 使用率 (需要取樣時間差)
        long[] prevTicks = processor.getSystemCpuLoadTicks();

        // 暫停 300ms 以計算這段時間內的 CPU 變化
        try {
            TimeUnit.MILLISECONDS.sleep(300);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        double cpuUsage = processor.getSystemCpuLoadBetweenTicks(prevTicks) * 100;

        // 2. 計算 Memory
        long totalMem = memory.getTotal();
        long availableMem = memory.getAvailable();
        long usedMem = totalMem - availableMem;

        return SystemStatusDTO.builder()
                .cpuUsage(round(cpuUsage))
                .coreCount(processor.getLogicalProcessorCount())
                .totalMemory(totalMem)
                .usedMemory(usedMem)
                .memoryUsage(round(((double) usedMem / totalMem) * 100))
                .osName(systemInfo.getOperatingSystem().toString())
                .systemLoad(processor.getSystemLoadAverage(1)[0]) // 取 1 分鐘平均負載
                .build();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
