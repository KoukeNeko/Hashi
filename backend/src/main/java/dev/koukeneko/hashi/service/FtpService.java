package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.CreateFtpUserRequest;
import dev.koukeneko.hashi.model.dto.FtpServerInfo;
import dev.koukeneko.hashi.model.dto.FtpUserDTO;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * FTP Server 管理服務
 * 支援 vsftpd, proftpd, pure-ftpd
 */
@Service
public class FtpService {

    // Server 設定資訊
    private static final Map<String, ServerConfig> SERVER_CONFIGS = Map.of(
            "vsftpd", new ServerConfig("vsftpd", "vsftpd", "/etc/vsftpd.conf", "/etc/vsftpd.userlist"),
            "proftpd", new ServerConfig("proftpd", "proftpd", "/etc/proftpd/proftpd.conf", null),
            "pure-ftpd", new ServerConfig("pure-ftpd", "pure-ftpd", "/etc/pure-ftpd/pure-ftpd.conf", null));

    private record ServerConfig(String type, String serviceName, String configPath, String userListPath) {
    }

    // ==================== Server Detection ====================

    /**
     * 偵測已安裝的 FTP servers
     */
    public List<FtpServerInfo> detectServers() {
        List<FtpServerInfo> servers = new ArrayList<>();

        for (ServerConfig config : SERVER_CONFIGS.values()) {
            if (isInstalled(config.type)) {
                boolean running = isServiceRunning(config.serviceName);
                boolean enabled = isServiceEnabled(config.serviceName);
                servers.add(new FtpServerInfo(
                        config.type,
                        config.serviceName,
                        config.configPath,
                        running,
                        enabled));
            }
        }

        return servers;
    }

    /**
     * 檢查 FTP server 是否已安裝
     */
    private boolean isInstalled(String type) {
        try {
            // 檢查執行檔是否存在
            ProcessBuilder pb = new ProcessBuilder("which", type);
            Process process = pb.start();
            int exitCode = process.waitFor();
            if (exitCode == 0)
                return true;

            // 檢查 systemd service
            pb = new ProcessBuilder("systemctl", "list-unit-files", type + ".service");
            process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.contains(type))
                    return true;
            }

            return false;
        } catch (Exception e) {
            return false;
        }
    }

    // ==================== Service Control ====================

    /**
     * 取得服務狀態
     */
    public FtpServerInfo getStatus(String type) {
        ServerConfig config = SERVER_CONFIGS.get(type);
        if (config == null) {
            throw new IllegalArgumentException("Unknown FTP server type: " + type);
        }

        boolean running = isServiceRunning(config.serviceName);
        boolean enabled = isServiceEnabled(config.serviceName);

        return new FtpServerInfo(
                config.type,
                config.serviceName,
                config.configPath,
                running,
                enabled);
    }

    /**
     * 啟用或停用服務
     */
    public void setEnabled(String type, boolean enabled) {
        ServerConfig config = SERVER_CONFIGS.get(type);
        if (config == null) {
            throw new IllegalArgumentException("Unknown FTP server type: " + type);
        }

        try {
            String action = enabled ? "start" : "stop";
            ProcessBuilder pb = new ProcessBuilder("sudo", "-n", "systemctl", action, config.serviceName);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new RuntimeException("Failed to " + action + " " + type + ": " + error);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to control service: " + e.getMessage(), e);
        }
    }

    private boolean isServiceRunning(String serviceName) {
        try {
            ProcessBuilder pb = new ProcessBuilder("systemctl", "is-active", serviceName);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String status = reader.readLine();
            return "active".equals(status);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isServiceEnabled(String serviceName) {
        try {
            ProcessBuilder pb = new ProcessBuilder("systemctl", "is-enabled", serviceName);
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String status = reader.readLine();
            return "enabled".equals(status);
        } catch (Exception e) {
            return false;
        }
    }

    // ==================== Config Management ====================

    /**
     * 讀取設定檔內容
     */
    public String getConfig(String type) {
        ServerConfig config = SERVER_CONFIGS.get(type);
        if (config == null) {
            throw new IllegalArgumentException("Unknown FTP server type: " + type);
        }

        try {
            Path path = Paths.get(config.configPath);
            if (!Files.exists(path)) {
                return "# Config file not found: " + config.configPath;
            }
            return Files.readString(path);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read config: " + e.getMessage(), e);
        }
    }

    /**
     * 寫入設定檔內容
     */
    public void updateConfig(String type, String content) {
        ServerConfig config = SERVER_CONFIGS.get(type);
        if (config == null) {
            throw new IllegalArgumentException("Unknown FTP server type: " + type);
        }

        try {
            // 使用 sudo tee 寫入
            ProcessBuilder pb = new ProcessBuilder("sudo", "-n", "tee", config.configPath);
            Process process = pb.start();

            try (OutputStream os = process.getOutputStream()) {
                os.write(content.getBytes());
                os.flush();
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new RuntimeException("Failed to write config: " + error);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to update config: " + e.getMessage(), e);
        }
    }

    // ==================== User Management ====================

    /**
     * 列出 FTP 使用者
     * 注意：不同 FTP server 的使用者管理方式不同
     */
    public List<FtpUserDTO> listUsers(String type) {
        // vsftpd 使用系統使用者或 userlist
        // proftpd 使用系統使用者
        // pure-ftpd 有自己的虛擬使用者資料庫

        try {
            // 簡化實作：讀取 /etc/passwd 中有 home 目錄的使用者
            // 只顯示 UID >= 1000 的普通使用者
            List<FtpUserDTO> users = new ArrayList<>();

            ProcessBuilder pb = new ProcessBuilder("getent", "passwd");
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(":");
                if (parts.length >= 6) {
                    int uid = Integer.parseInt(parts[2]);
                    String username = parts[0];
                    String homeDir = parts[5];

                    // 只顯示普通使用者 (UID >= 1000) 且不是 nobody/nfsnobody
                    if (uid >= 1000 && !username.equals("nobody") && !username.equals("nfsnobody")) {
                        boolean enabled = isUserEnabled(type, username);
                        users.add(new FtpUserDTO(username, homeDir, enabled));
                    }
                }
            }

            return users;
        } catch (Exception e) {
            throw new RuntimeException("Failed to list users: " + e.getMessage(), e);
        }
    }

    /**
     * 檢查使用者是否啟用 FTP 存取
     */
    private boolean isUserEnabled(String type, String username) {
        ServerConfig config = SERVER_CONFIGS.get(type);
        if (config == null || config.userListPath == null) {
            return true; // 沒有 userlist 就預設啟用
        }

        try {
            Path path = Paths.get(config.userListPath);
            if (!Files.exists(path))
                return true;

            List<String> lines = Files.readAllLines(path);
            return lines.stream().anyMatch(line -> line.trim().equals(username));
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * 新增 FTP 使用者
     */
    public void addUser(String type, CreateFtpUserRequest request) {
        try {
            String username = request.username();
            String password = request.password();
            String homeDir = request.homeDir();

            if (homeDir == null || homeDir.isBlank()) {
                homeDir = "/home/" + username;
            }

            // 建立系統使用者
            List<String> cmd = new ArrayList<>(Arrays.asList(
                    "sudo", "-n", "useradd",
                    "-m", // 建立 home 目錄
                    "-d", homeDir,
                    "-s", "/bin/bash",
                    username));

            ProcessBuilder pb = new ProcessBuilder(cmd);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode != 0 && exitCode != 9) { // 9 = user already exists
                String error = new String(process.getErrorStream().readAllBytes());
                throw new RuntimeException("Failed to create user: " + error);
            }

            // 設定密碼
            pb = new ProcessBuilder("sudo", "-n", "chpasswd");
            process = pb.start();
            try (OutputStream os = process.getOutputStream()) {
                os.write((username + ":" + password).getBytes());
                os.flush();
            }
            process.waitFor();

            // 如果是 vsftpd 且有 userlist，加入使用者
            addToUserList(type, username);

        } catch (Exception e) {
            throw new RuntimeException("Failed to add user: " + e.getMessage(), e);
        }
    }

    /**
     * 刪除 FTP 使用者
     */
    public void deleteUser(String type, String username) {
        try {
            // 從 userlist 移除
            removeFromUserList(type, username);

            // 刪除系統使用者 (保留 home 目錄)
            ProcessBuilder pb = new ProcessBuilder("sudo", "-n", "userdel", username);
            Process process = pb.start();
            process.waitFor();

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete user: " + e.getMessage(), e);
        }
    }

    /**
     * 更新 FTP 使用者
     */
    public void updateUser(String type, String username, dev.koukeneko.hashi.model.dto.UpdateFtpUserRequest request) {
        try {
            // 檢查使用者是否存在
            if (!userExists(username)) {
                throw new RuntimeException("User not found: " + username);
            }

            // 修改密碼
            if (request.password() != null && !request.password().isBlank()) {
                ProcessBuilder pb = new ProcessBuilder("sudo", "-n", "chpasswd");
                Process process = pb.start();
                try (OutputStream os = process.getOutputStream()) {
                    os.write((username + ":" + request.password()).getBytes());
                    os.flush();
                }
                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    throw new RuntimeException("Failed to update password");
                }
            }

            // 修改 Home 目錄
            if (request.homeDir() != null && !request.homeDir().isBlank()) {
                List<String> cmd = new ArrayList<>();
                cmd.add("sudo");
                cmd.add("-n");
                cmd.add("usermod");
                cmd.add("-d");
                cmd.add(request.homeDir());

                if (request.moveContent()) {
                    cmd.add("-m");
                }

                cmd.add(username);

                ProcessBuilder pb = new ProcessBuilder(cmd);
                Process process = pb.start();
                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    String error = new String(process.getErrorStream().readAllBytes());
                    throw new RuntimeException("Failed to update home directory: " + error);
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    private boolean userExists(String username) {
        try {
            ProcessBuilder pb = new ProcessBuilder("id", username);
            Process process = pb.start();
            return process.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void addToUserList(String type, String username) {
        ServerConfig config = SERVER_CONFIGS.get(type);
        if (config == null || config.userListPath == null)
            return;

        try {
            Path path = Paths.get(config.userListPath);
            List<String> users = Files.exists(path) ? new ArrayList<>(Files.readAllLines(path)) : new ArrayList<>();

            if (!users.contains(username)) {
                users.add(username);
                String content = String.join("\n", users) + "\n";

                ProcessBuilder pb = new ProcessBuilder("sudo", "-n", "tee", config.userListPath);
                Process process = pb.start();
                try (OutputStream os = process.getOutputStream()) {
                    os.write(content.getBytes());
                }
                process.waitFor();
            }
        } catch (Exception e) {
            // 忽略 userlist 錯誤
        }
    }

    private void removeFromUserList(String type, String username) {
        ServerConfig config = SERVER_CONFIGS.get(type);
        if (config == null || config.userListPath == null)
            return;

        try {
            Path path = Paths.get(config.userListPath);
            if (!Files.exists(path))
                return;

            List<String> users = Files.readAllLines(path).stream()
                    .filter(line -> !line.trim().equals(username))
                    .collect(Collectors.toList());

            String content = String.join("\n", users) + "\n";

            ProcessBuilder pb = new ProcessBuilder("sudo", "-n", "tee", config.userListPath);
            Process process = pb.start();
            try (OutputStream os = process.getOutputStream()) {
                os.write(content.getBytes());
            }
            process.waitFor();
        } catch (Exception e) {
            // 忽略
        }
    }

    // ==================== Logs ====================

    /**
     * 取得 FTP 日誌
     */
    public List<String> getLogs(String type, int lines) {
        ServerConfig config = SERVER_CONFIGS.get(type);
        if (config == null) {
            throw new IllegalArgumentException("Unknown FTP server type: " + type);
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "journalctl", "-u", config.serviceName, "-n", String.valueOf(lines), "--no-pager");
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            List<String> logLines = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                logLines.add(line);
            }

            return logLines;
        } catch (Exception e) {
            return List.of("Failed to read logs: " + e.getMessage());
        }
    }
}
