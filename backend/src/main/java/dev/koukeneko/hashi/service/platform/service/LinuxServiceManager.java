package dev.koukeneko.hashi.service.platform.service;

import dev.koukeneko.hashi.model.dto.ServiceItemDTO;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Linux Systemd 服務管理實作
 */
@Slf4j
public class LinuxServiceManager implements ServiceManager {

    private static final List<String> ALLOWED_ACTIONS = List.of("start", "stop", "restart");

    @Override
    public List<ServiceItemDTO> listServices() {
        List<ServiceItemDTO> services = new ArrayList<>();
        try {
            // 指令解釋：
            // list-units: 列出單元
            // --type=service: 只看服務
            // --all: 包含未執行的
            // --no-pager: 不要分頁 (直接輸出到底)
            // --no-legend: 不要顯示標題欄 (方便解析)
            ProcessBuilder builder = new ProcessBuilder(
                    "systemctl", "list-units", "--type=service", "--all", "--no-pager", "--no-legend");
            Process process = builder.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                // Systemd 輸出格式通常是：
                // unit_name load_state active_state sub_state description...
                // 用正規表達式切分 (至少切成 5 份)
                String[] parts = line.trim().split("\\s+", 5);

                if (parts.length >= 5) {
                    services.add(ServiceItemDTO.builder()
                            .name(parts[0])
                            .loadState(parts[1])
                            .activeState(parts[2])
                            .subState(parts[3])
                            .description(parts[4])
                            .build());
                }
            }
            process.waitFor(5, TimeUnit.SECONDS);

        } catch (Exception e) {
            log.error("Failed to list systemd services", e);
        }

        return services;
    }

    @Override
    public void controlService(String serviceName, String action) {
        // 安全檢查：只允許特定的 action
        if (!ALLOWED_ACTIONS.contains(action)) {
            throw new IllegalArgumentException("Invalid action: " + action);
        }

        try {
            ProcessBuilder builder = new ProcessBuilder("systemctl", action, serviceName);
            builder.redirectErrorStream(true);
            Process process = builder.start();

            String output = new String(process.getInputStream().readAllBytes()).trim();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String errorMsg = output.isEmpty()
                        ? "Permission denied or service not found"
                        : output;
                throw new RuntimeException(errorMsg);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to " + action + " service: " + e.getMessage(), e);
        }
    }
}
