package dev.koukeneko.hashi.service.platform.storage;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.koukeneko.hashi.model.dto.SmartAttributeDTO;
import dev.koukeneko.hashi.model.dto.SmartInfoDTO;
import dev.koukeneko.hashi.model.dto.SystemDiskDTO;
import dev.koukeneko.hashi.service.DiskService;
import dev.koukeneko.hashi.service.SmartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * S.M.A.R.T. 硬碟健康監測服務實作
 * 使用 smartctl 工具取得硬碟健康資訊
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LinuxSmartService implements SmartService {

    private final DiskService diskService;
    private final ObjectMapper objectMapper;

    @Override
    public SmartInfoDTO getHealth(String device) {
        try {
            // 使用 smartctl 取得 JSON 格式輸出
            ProcessBuilder pb = new ProcessBuilder(
                    "sudo", "-n", "smartctl", "-a", "-j", device);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            process.waitFor();

            String jsonOutput = output.toString().trim();

            // 檢查輸出是否為 JSON 格式
            if (!jsonOutput.startsWith("{")) {
                log.warn("smartctl 回傳非 JSON 輸出 (可能需要 sudo 權限): {}",
                        jsonOutput.length() > 100 ? jsonOutput.substring(0, 100) + "..." : jsonOutput);
                return SmartInfoDTO.builder()
                        .device(device)
                        .smartSupported(false)
                        .healthStatus("UNKNOWN")
                        .build();
            }

            return parseSmartctlOutput(device, jsonOutput);

        } catch (Exception e) {
            log.error("取得 {} S.M.A.R.T. 資訊失敗: {}", device, e.getMessage());
            return SmartInfoDTO.builder()
                    .device(device)
                    .smartSupported(false)
                    .healthStatus("UNKNOWN")
                    .build();
        }
    }

    private SmartInfoDTO parseSmartctlOutput(String device, String jsonOutput) {
        try {
            JsonNode root = objectMapper.readTree(jsonOutput);

            SmartInfoDTO.SmartInfoDTOBuilder builder = SmartInfoDTO.builder()
                    .device(device);

            // 解析裝置資訊
            builder.model(root.path("model_name").asText(null));
            builder.serial(root.path("serial_number").asText(null));

            // 判斷是否為 NVMe
            boolean isNvme = root.path("device").path("type").asText("").contains("nvme");

            // 解析 S.M.A.R.T. 支援狀態
            JsonNode smartStatus = root.path("smart_status");
            if (!smartStatus.isMissingNode()) {
                boolean passed = smartStatus.path("passed").asBoolean(true);
                builder.healthStatus(passed ? "PASSED" : "FAILED");
            } else {
                builder.healthStatus("UNKNOWN");
            }

            // S.M.A.R.T. 啟用狀態
            JsonNode smartSupport = root.path("smart_support");
            if (!smartSupport.isMissingNode()) {
                builder.smartSupported(smartSupport.path("available").asBoolean(false));
                builder.smartEnabled(smartSupport.path("enabled").asBoolean(false));
            } else {
                // NVMe 預設支援 S.M.A.R.T.
                builder.smartSupported(isNvme);
                builder.smartEnabled(isNvme);
            }

            // 解析溫度
            JsonNode temperature = root.path("temperature");
            if (!temperature.isMissingNode()) {
                builder.temperature(temperature.path("current").asInt(0));
            }

            // NVMe 專用: nvme_smart_health_information_log
            JsonNode nvmeHealth = root.path("nvme_smart_health_information_log");
            if (!nvmeHealth.isMissingNode()) {
                // NVMe 溫度
                if (builder.build().getTemperature() == null || builder.build().getTemperature() == 0) {
                    builder.temperature(nvmeHealth.path("temperature").asInt(0));
                }
                // NVMe 通電時間
                builder.powerOnHours(nvmeHealth.path("power_on_hours").asLong(0));
                // NVMe 啟動次數
                builder.powerCycleCount(nvmeHealth.path("power_cycles").asLong(0));
            } else {
                // SATA: 解析通電時間
                JsonNode powerOnTime = root.path("power_on_time");
                if (!powerOnTime.isMissingNode()) {
                    builder.powerOnHours(powerOnTime.path("hours").asLong(0));
                }
                // SATA: 解析啟動次數
                JsonNode powerCycleCount = root.path("power_cycle_count");
                if (!powerCycleCount.isMissingNode()) {
                    builder.powerCycleCount(powerCycleCount.asLong(0));
                }
            }

            // 解析 ATA S.M.A.R.T. 屬性 (SATA only)
            List<SmartAttributeDTO> attributes = new ArrayList<>();
            JsonNode ataAttributes = root.path("ata_smart_attributes").path("table");
            if (ataAttributes.isArray()) {
                for (JsonNode attr : ataAttributes) {
                    SmartAttributeDTO attrDto = SmartAttributeDTO.builder()
                            .id(attr.path("id").asInt())
                            .name(attr.path("name").asText())
                            .value(attr.path("value").asInt())
                            .worst(attr.path("worst").asInt())
                            .threshold(attr.path("thresh").asInt())
                            .rawValue(attr.path("raw").path("string").asText())
                            .type(attr.path("flags").path("prefailure").asBoolean() ? "Pre-fail" : "Old_age")
                            .failing(attr.path("when_failed").asText("").length() > 0)
                            .build();
                    attributes.add(attrDto);

                    // 特別處理重新分配磁區數 (ID 5)
                    if (attrDto.getId() == 5) {
                        try {
                            builder.reallocatedSectorCount(Long.parseLong(attrDto.getRawValue().split(" ")[0]));
                        } catch (Exception ignored) {
                        }
                    }
                }
            }
            builder.attributes(attributes);

            return builder.build();

        } catch (Exception e) {
            log.error("解析 smartctl 輸出失敗: {}", e.getMessage());
            return SmartInfoDTO.builder()
                    .device(device)
                    .smartSupported(false)
                    .healthStatus("UNKNOWN")
                    .build();
        }
    }

    @Override
    public List<SmartInfoDTO> listAllHealth() {
        List<SmartInfoDTO> results = new ArrayList<>();

        // 取得所有磁碟
        List<SystemDiskDTO> disks = diskService.listDisks();
        for (SystemDiskDTO disk : disks) {
            // 只檢查實體磁碟，跳過 loop 裝置
            if ("disk".equals(disk.getType()) && !disk.getName().startsWith("loop")) {
                results.add(getHealth(disk.getPath()));
            }
        }

        return results;
    }

    @Override
    public void runTest(String device, String testType) {
        if (!device.startsWith("/dev/")) {
            throw new IllegalArgumentException("無效的裝置路徑");
        }

        if (!"short".equals(testType) && !"long".equals(testType)) {
            throw new IllegalArgumentException("測試類型必須為 'short' 或 'long'");
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "sudo", "-n", "smartctl", "-t", testType, device);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode != 0 && !output.contains("Testing has begun")) {
                throw new RuntimeException("啟動測試失敗: " + output);
            }

            log.info("已啟動 {} 的 {} S.M.A.R.T. 測試", device, testType);

        } catch (Exception e) {
            log.error("執行 S.M.A.R.T. 測試失敗", e);
            throw new RuntimeException("執行測試失敗", e);
        }
    }
}
