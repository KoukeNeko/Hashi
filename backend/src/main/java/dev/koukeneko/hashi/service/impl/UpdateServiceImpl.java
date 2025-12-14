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
 * 支援 APT (Debian/Ubuntu) 和 RPM (CentOS/RHEL) 套件管理器
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

    /** 套件管理器類型 */
    private enum PackageManager {
        APT, RPM, UNKNOWN
    }

    /** 從系統動態偵測的資訊 */
    private PackageManager packageManager;
    private String installedPackageName;
    private String installedVersion;
    private String detectedChannel;

    private UpdateInfoDTO cachedInfo;
    private Instant lastCheckTime;

    @PostConstruct
    public void init() {
        detectPackageManager();
        detectInstalledPackage();
    }

    /**
     * 偵測系統使用的套件管理器
     */
    private void detectPackageManager() {
        if (commandExists("dpkg")) {
            packageManager = PackageManager.APT;
            log.info("Detected package manager: APT (Debian/Ubuntu)");
        } else if (commandExists("rpm")) {
            packageManager = PackageManager.RPM;
            log.info("Detected package manager: RPM (CentOS/RHEL)");
        } else {
            packageManager = PackageManager.UNKNOWN;
            log.warn("No supported package manager detected");
        }
    }

    private boolean commandExists(String command) {
        try {
            ProcessBuilder pb = new ProcessBuilder("which", command);
            Process process = pb.start();
            return process.waitFor(5, TimeUnit.SECONDS) && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 偵測已安裝的 Hashi 套件
     */
    private void detectInstalledPackage() {
        log.info("Detecting installed Hashi package...");

        String[] packageNames = { PACKAGE_STABLE, PACKAGE_BETA, PACKAGE_DEV };

        for (String packageName : packageNames) {
            String version = getInstalledVersion(packageName);
            if (version != null) {
                this.installedPackageName = packageName;
                this.installedVersion = version;
                this.detectedChannel = getChannelFromPackageName(packageName);
                log.info("Detected installed package: {} v{} (channel: {})",
                        packageName, version, detectedChannel);
                return;
            }
        }

        // 開發模式預設值
        log.warn("No Hashi package detected, using development defaults");
        this.installedPackageName = PACKAGE_DEV;
        this.installedVersion = "dev";
        this.detectedChannel = "dev";
    }

    private String getInstalledVersion(String packageName) {
        return switch (packageManager) {
            case APT -> getVersionFromDpkg(packageName);
            case RPM -> getVersionFromRpm(packageName);
            default -> null;
        };
    }

    private String getVersionFromDpkg(String packageName) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "dpkg-query", "-W", "-f=${Version}", packageName);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = readProcessOutput(process);
            if (process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0) {
                String version = output.trim();
                return version.isEmpty() ? null : version;
            }
        } catch (Exception e) {
            log.debug("dpkg query failed for {}: {}", packageName, e.getMessage());
        }
        return null;
    }

    private String getVersionFromRpm(String packageName) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "rpm", "-q", "--queryformat", "%{VERSION}", packageName);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = readProcessOutput(process);
            if (process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0) {
                String version = output.trim();
                return version.isEmpty() || version.contains("not installed") ? null : version;
            }
        } catch (Exception e) {
            log.debug("rpm query failed for {}: {}", packageName, e.getMessage());
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
        log.info("Checking for updates via {}...", packageManager);

        try {
            runRepositoryUpdate();
            String latestVersion = getLatestVersion(installedPackageName);

            cachedInfo = buildUpdateInfo(latestVersion);
            lastCheckTime = Instant.now();

            log.info("Update check completed. Latest: {}, Installed: {}",
                    cachedInfo.latestVersion(), cachedInfo.currentVersion());
            return cachedInfo;
        } catch (Exception e) {
            log.warn("Failed to check for updates: {}", e.getMessage());
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
     * 嘗試更新套件庫索引（非必要，失敗不影響版本檢查）
     */
    private void runRepositoryUpdate() {
        try {
            ProcessBuilder pb = switch (packageManager) {
                // 使用絕對路徑避免 sudo path 問題
                case APT -> new ProcessBuilder("sudo", "/usr/bin/apt-get", "update", "-qq");
                case RPM -> new ProcessBuilder("sudo", "/usr/bin/dnf", "check-update", "-q");
                default -> null;
            };

            if (pb != null) {
                log.debug("Attempting repository update for {}...", packageManager);
                pb.redirectErrorStream(true);
                Process process = pb.start();

                // 消耗 process output 避免 blocking，但不需要使用內容
                readProcessOutput(process);
                boolean completed = process.waitFor(COMMAND_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
                int exitCode = completed ? process.exitValue() : -1;

                if (completed && exitCode == 0) {
                    log.info("Repository cache updated successfully");
                } else {
                    // 不是致命錯誤，繼續使用現有快取
                    log.debug("Repository update skipped (exit code {}). Using cached package info.", exitCode);
                }
            }
        } catch (Exception e) {
            // 不是致命錯誤，繼續使用現有快取
            log.debug("Repository update skipped: {}. Using cached package info.", e.getMessage());
        }
    }

    private String getLatestVersion(String packageName) {
        return switch (packageManager) {
            case APT -> getLatestVersionFromApt(packageName);
            case RPM -> getLatestVersionFromDnf(packageName);
            default -> "unknown";
        };
    }

    private String getLatestVersionFromApt(String packageName) {
        try {
            ProcessBuilder pb = new ProcessBuilder("apt-cache", "policy", packageName);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = readProcessOutput(process);
            process.waitFor();

            Pattern pattern = Pattern.compile("Candidate:\\s*([\\d.]+(?:[+~-][\\w.]+)?)");
            Matcher matcher = pattern.matcher(output);
            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception e) {
            log.warn("apt-cache policy failed: {}", e.getMessage());
        }
        return "unknown";
    }

    private String getLatestVersionFromDnf(String packageName) {
        try {
            // dnf info 會顯示可用的最新版本
            ProcessBuilder pb = new ProcessBuilder("dnf", "info", "--available", packageName);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = readProcessOutput(process);
            process.waitFor();

            Pattern pattern = Pattern.compile("Version\\s*:\\s*([\\d.]+(?:[+~-][\\w.]+)?)");
            Matcher matcher = pattern.matcher(output);
            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception e) {
            log.warn("dnf info failed: {}", e.getMessage());
        }
        return "unknown";
    }

    private String readProcessOutput(Process process) throws Exception {
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }
        return output.toString();
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
        return switch (packageManager) {
            case APT -> String.format("sudo apt update && sudo apt upgrade %s", installedPackageName);
            case RPM -> String.format("sudo dnf upgrade %s", installedPackageName);
            default -> "Please update using your system's package manager";
        };
    }

    /**
     * 比較版本號
     * 支援格式：major.minor.patch 或 major.minor.patch.build
     * 例如：0.0.1.5 > 0.0.1.4 > 0.0.1
     */
    private int compareVersions(String v1, String v2) {
        if ("unknown".equals(v1) || "(none)".equals(v1) || "dev".equals(v2)) {
            return 0;
        }

        // 移除可能的舊格式後綴 (+xxx 或 ~xxx)
        String cleanV1 = v1.replaceAll("[+~].*$", "");
        String cleanV2 = v2.replaceAll("[+~].*$", "");

        String[] parts1 = cleanV1.split("\\.");
        String[] parts2 = cleanV2.split("\\.");

        int maxLength = Math.max(parts1.length, parts2.length);
        for (int i = 0; i < maxLength; i++) {
            // dpkg 邏輯：如果一段有數值，一段沒有，沒有的那段視為 -1 (比 0 小)
            // 這樣確保 0.0.1.0 > 0.0.1
            int num1 = i < parts1.length ? parseVersionPart(parts1[i]) : -1;
            int num2 = i < parts2.length ? parseVersionPart(parts2[i]) : -1;
            if (num1 != num2)
                return num1 - num2;
        }
        return 0;
    }

    private int parseVersionPart(String part) {
        try {
            return Integer.parseInt(part.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
