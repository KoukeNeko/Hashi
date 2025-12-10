package dev.koukeneko.hashi.service.platform.scheduler;

import dev.koukeneko.hashi.model.dto.CronJobDTO;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Linux Crontab 排程管理實作
 */
@Slf4j
public class LinuxCronManager implements SchedulerManager {

    @Override
    public List<CronJobDTO> listJobs() {
        List<CronJobDTO> jobs = new ArrayList<>();
        try {
            Process process = new ProcessBuilder("crontab", "-l").start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // 忽略空行或註解
                if (line.isEmpty() || line.startsWith("#"))
                    continue;

                // 解析：Cron 表達式通常前 5 個部分是時間，後面是指令
                String[] parts = line.split("\\s+", 6);
                if (parts.length == 6) {
                    String expression = String.format("%s %s %s %s %s",
                            parts[0], parts[1], parts[2], parts[3], parts[4]);
                    String command = parts[5];

                    jobs.add(CronJobDTO.builder()
                            .id(UUID.randomUUID().toString())
                            .expression(expression)
                            .command(command)
                            .build());
                }
            }
            process.waitFor();

        } catch (Exception e) {
            log.debug("No crontab for current user or error reading crontab", e);
            return new ArrayList<>();
        }
        return jobs;
    }

    @Override
    public void saveJobs(List<CronJobDTO> jobs) {
        try {
            String cronContent = jobs.stream()
                    .map(job -> String.format("%s %s", job.expression(), job.command()))
                    .collect(Collectors.joining("\n"));

            // 確保檔尾有換行
            cronContent += "\n";

            Path tempFile = Files.createTempFile("cron-", ".tmp");
            Files.writeString(tempFile, cronContent);

            Process process = new ProcessBuilder("crontab", tempFile.toString()).start();
            int exitCode = process.waitFor();

            Files.deleteIfExists(tempFile);

            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new RuntimeException("Failed to update crontab: " + error);
            }

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error saving cron jobs", e);
        }
    }
}
