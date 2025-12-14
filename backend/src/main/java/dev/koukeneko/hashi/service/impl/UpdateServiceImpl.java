package dev.koukeneko.hashi.service.impl;

import dev.koukeneko.hashi.model.dto.UpdateInfoDTO;
import dev.koukeneko.hashi.service.UpdateService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 更新檢查服務實作
 * 透過 dpkg 檢測已安裝的套件資訊，透過 apt 檢查最新版本
 */
@Service
@Slf4j
public class UpdateServiceImpl implements UpdateService {

    private static final Duration CACHE_DURATION = Duration.ofMinutes(30);
    private static final Duration COMMAND_TIMEOUT = Duration.ofSeconds(60);

    /** 套件名稱對應的頻道 */
    private static final String PACKAGE_STABLE = "hashi";
    private static final String PACKAGE_BETA = "hashi-beta";
    private static final String PACKAGE_DEV = "hashi-dev";

    /** 從系統動態偵測的套件資訊 */
    private String installedPackageName;
    private String installedVersion;
    private String detectedChannel;

    private UpdateInfoDTO cachedInfo;
    private Instant lastCheckTime;

    @PostConstruct
    public void init() {
        detectInstalledPackage();
    }

    /**
     * 從 dpkg 偵測已安裝的 Hashi 套件資訊
     */
    private void detectInstalledPackage() {
        log.info("Detecting installed Hashi package...");

        // 依優先順序檢查各頻道的套件
        String[] packageNames = { PACKAGE_STABLE, PACKAGE_BETA, PACKAGE_DEV };

        for (String packageName : packageNames) {
            String version = getInstalledVersionFromDpkg(packageName);
            if (version != null) {
                this.installedPackageName = packageName;
                this.installedVersion = version;
                this.detectedChannel = getChannelFromPackageName(packageName);
                log.info("Detected installed package: {} v{} (channel: {})",
                        packageName, version, detectedChannel);
                return;
            }
        }

        // 如果找不到已安裝的套件，使用預設值（開發模式）
        log.warn("No Hashi package detected via dpkg, using development defaults");
        this.installedPackageName = PACKAGE_DEV;
        this.installedVersion = "dev";
        this.detectedChannel = "dev";
    }

    /**
     * 使用 dpkg-query 取得指定套件的已安裝版本
     *
     * @return 版本號，如果未安裝則返回 null
     */
    private String getInstalledVersionFromDpkg(String packageName) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "dpkg-query", "-W", "-f=${Version}", packageName);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return null;
            }

            if (process.exitValue() == 0) {
                String version = output.toString().trim();
                if (!version.isEmpty()) {
                    return version;
                }
            }
        } catch (Exception e) {
            log.debug("Package {} not found: {}", packageName, e.getMessage());
        }
        return null;
    }

    private String getChannelFromPackageName(String packageName) {
        return switch (packageName) {
            case PACKAGE_STABLE -> "stable";
            case PACKAGE_BETA -> "beta";
            default -> "dev";
        };
    }

    @Override
    public UpdateInfoDTO getUpdateInfo() {
        if (isCacheValid()) {
            return cachedInfo;
        }
        return checkForUpdates();
    }

    @Override
    public UpdateInfoDTO checkForUpdates() {
        log.info("Checking for updates via apt...");

        try {
            // 先執行 apt update 更新套件索引
            runAptUpdate();

            // 使用 apt-cache policy 檢查可用版本
            String latestVersion = getLatestVersionFromApt(installedPackageName);

            cachedInfo = buildUpdateInfo(latestVersion);
            lastCheckTime = Instant.now();

            log.info("Update check completed. Latest: {}, Installed: {}",
                    cachedInfo.latestVersion(), cachedInfo.currentVersion());
            return cachedInfo;
        } catch (Exception e) {
            log.warn("Failed to check for updates via apt: {}", e.getMessage());
            return buildFallbackInfo();
        }
    }

    private boolean isCacheValid() {
        if (cachedInfo == null || lastCheckTime == null) {
            return false;
        }
        return Duration.between(lastCheckTime, Instant.now()).compareTo(CACHE_DURATION) < 0;
    }

    /**
     * 執行 apt update 更新套件索引
     */
    private void runAptUpdate() {
        try {
            log.debug("Running apt update...");
            ProcessBuilder pb = new ProcessBuilder("sudo", "apt-get", "update", "-qq");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            boolean finished = process.waitFor(COMMAND_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("apt update timed out");
            }
        } catch (Exception e) {
            log.warn("Failed to run apt update: {}", e.getMessage());
        }
    }

    /**
     * 使用 apt-cache policy 取得指定套件的最新可用版本
     */
    private String getLatestVersionFromApt(String packageName) throws Exception {
        ProcessBuilder pb = new ProcessBuilder("apt-cache", "policy", packageName);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        process.waitFor();
        return parseCandidateVersion(output.toString());
    }

    /**
     * 從 apt-cache policy 輸出中解析 Candidate 版本
     */
    private String parseCandidateVersion(String policyOutput) {
        Pattern pattern = Pattern.compile("Candidate:\\s*([\\d.]+(?:-[\\w.]+)?)");
        Matcher matcher = pattern.matcher(policyOutput);

        if (matcher.find()) {
            return matcher.group(1);
        }

        return "unknown";
    }

    private UpdateInfoDTO buildUpdateInfo(String latestVersion) {
        boolean updateAvailable = compareVersions(latestVersion, installedVersion) > 0;

        return UpdateInfoDTO.builder()
                .currentVersion(installedVersion)
                .latestVersion(latestVersion)
                .updateAvailable(updateAvailable)
                .channel(detectedChannel)
                .releaseNotes(updateAvailable ? generateUpdateInstructions() : "")
                .downloadUrl("")
                .lastChecked(Instant.now().toString())
                .build();
    }

    private UpdateInfoDTO buildFallbackInfo() {
        return UpdateInfoDTO.builder()
                .currentVersion(installedVersion)
                .latestVersion("unknown")
                .updateAvailable(false)
                .channel(detectedChannel)
                .releaseNotes("")
                .downloadUrl("")
                .lastChecked(lastCheckTime != null ? lastCheckTime.toString() : "never")
                .build();
    }

    private String generateUpdateInstructions() {
        return String.format("""
                To update, run:
                sudo apt update && sudo apt upgrade %s
                """, installedPackageName);
    }

    /**
     * 比較兩個語義化版本號
     */
    private int compareVersions(String v1, String v2) {
        if ("unknown".equals(v1) || "(none)".equals(v1) || "dev".equals(v2)) {
            return 0;
        }

        String[] parts1 = normalizeVersion(v1).split("\\.");
        String[] parts2 = normalizeVersion(v2).split("\\.");

        int maxLength = Math.max(parts1.length, parts2.length);

        for (int i = 0; i < maxLength; i++) {
            int num1 = i < parts1.length ? parseVersionPart(parts1[i]) : 0;
            int num2 = i < parts2.length ? parseVersionPart(parts2[i]) : 0;

            if (num1 != num2) {
                return num1 - num2;
            }
        }

        return 0;
    }

    private String normalizeVersion(String version) {
        return version.replaceAll("-.*$", "");
    }

    private int parseVersionPart(String part) {
        try {
            return Integer.parseInt(part.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
