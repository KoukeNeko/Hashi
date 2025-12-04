package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.CronJobDTO;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CronService {

    // 讀取目前的排程
    public List<CronJobDTO> listJobs() {
        List<CronJobDTO> jobs = new ArrayList<>();
        try {
            // 執行 crontab -l
            Process process = new ProcessBuilder("crontab", "-l").start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // 忽略空行或註解 (以 # 開頭)
                if (line.isEmpty() || line.startsWith("#")) continue;

                // 解析：Cron 表達式通常前 5 個部分是時間，後面是指令
                // 分割成最大 6 等份：分 時 日 月 週 指令
                String[] parts = line.split("\\s+", 6);
                if (parts.length == 6) {
                    String expression = String.format("%s %s %s %s %s",
                            parts[0], parts[1], parts[2], parts[3], parts[4]);
                    String command = parts[5];

                    jobs.add(CronJobDTO.builder()
                            .id(UUID.randomUUID().toString()) // 暫時給個隨機 ID 給前端 Key 使用
                            .expression(expression)
                            .command(command)
                            .build());
                }
            }
            // crontab -l 如果是空的會回傳 exit code 1 (no crontab for user)，這不是錯誤
            process.waitFor();

        } catch (Exception e) {
            // 如果 user 沒有 crontab，通常不是大問題，回傳空列表即可
            return new ArrayList<>();
        }
        return jobs;
    }

    // 儲存所有排程 (覆蓋式更新)
    public void saveJobs(List<CronJobDTO> jobs) {
        try {
            // 1. 把 DTO 轉回 Cron 格式的字串
            String cronContent = jobs.stream()
                    .map(job -> String.format("%s %s", job.expression(), job.command()))
                    .collect(Collectors.joining("\n"));

            // 確保檔尾有換行，不然 crontab 可能會抱怨
            cronContent += "\n";

            // 2. 寫入暫存檔
            Path tempFile = Files.createTempFile("cron-", ".tmp");
            Files.writeString(tempFile, cronContent);

            // 3. 呼叫 crontab [file] 來載入
            Process process = new ProcessBuilder("crontab", tempFile.toString()).start();
            int exitCode = process.waitFor();

            // 4. 刪除暫存檔
            Files.deleteIfExists(tempFile);

            if (exitCode != 0) {
                // 讀取錯誤訊息
                String error = new String(process.getErrorStream().readAllBytes());
                throw new RuntimeException("Failed to update crontab: " + error);
            }

        } catch (Exception e) {
            throw new RuntimeException("Error saving cron jobs", e);
        }
    }
}
