package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.ServiceItemDTO;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class SystemdService {

    /**
     * 列出所有 Systemd 服務
     */
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
                    "systemctl", "list-units", "--type=service", "--all", "--no-pager", "--no-legend"
            );
            Process process = builder.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                // Systemd 輸出格式通常是：
                // unit_name  load_state  active_state  sub_state  description...
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
            e.printStackTrace(); // TODO: 實務上用 Logger
        }

        // TODO: 過濾掉一些雜訊，只回傳比較重要的服務 (可選)
        return services;
    }

    /**
     * 控制服務 (Start/Stop/Restart)
     * 注意：這通常需要 sudo 權限！
     */
    public void controlService(String serviceName, String action) {
        // 安全檢查：只允許特定的 action
        if (!List.of("start", "stop", "restart").contains(action)) {
            throw new IllegalArgumentException("Invalid action");
        }

        try {
            // 這裡未來可能需要 sudo，如果 Spring Boot 不是以 root 執行
            ProcessBuilder builder = new ProcessBuilder("systemctl", action, serviceName);
            builder.redirectErrorStream(true); // 合併 stdout 和 stderr
            Process process = builder.start();
            
            // 讀取輸出
            String output = new String(process.getInputStream().readAllBytes()).trim();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String errorMsg = output.isEmpty() 
                    ? "Permission denied or service not found" 
                    : output;
                throw new RuntimeException(errorMsg);
            }
        } catch (RuntimeException e) {
            throw e; // 重新拋出已處理的錯誤
        } catch (Exception e) {
            throw new RuntimeException("Failed to " + action + " service: " + e.getMessage(), e);
        }
    }
}
