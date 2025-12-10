package dev.koukeneko.hashi.service.platform.auth;

import dev.koukeneko.hashi.model.dto.UserInfoDTO;
import dev.koukeneko.hashi.service.AuthService;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Optional;

/**
 * Linux PAM 認證提供者實作
 */
@Slf4j
public class LinuxPamAuthProvider implements AuthService {

    @Override
    public Optional<UserInfoDTO> authenticate(String username, String password) {
        try {
            // 使用 su 命令驗證密碼
            ProcessBuilder pb = new ProcessBuilder("su", "-c", "exit", username);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 將密碼寫入 stdin
            process.getOutputStream().write((password + "\n").getBytes());
            process.getOutputStream().flush();
            process.getOutputStream().close();

            int exitCode = process.waitFor();

            if (exitCode == 0) {
                log.info("User {} authenticated successfully", username);
                return getUserInfo(username);
            } else {
                log.warn("Authentication failed for user {}", username);
                return Optional.empty();
            }
        } catch (Exception e) {
            log.error("Error during authentication for user {}: {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<UserInfoDTO> validateUser(String username) {
        return getUserInfo(username);
    }

    /**
     * 從 /etc/passwd 獲取使用者資訊
     */
    private Optional<UserInfoDTO> getUserInfo(String username) {
        try {
            ProcessBuilder pb = new ProcessBuilder("getent", "passwd", username);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line = reader.readLine();
                process.waitFor();

                if (line != null && !line.isEmpty()) {
                    // 格式: username:x:uid:gid:gecos:home:shell
                    String[] parts = line.split(":");
                    if (parts.length >= 7) {
                        return Optional.of(UserInfoDTO.builder()
                                .username(parts[0])
                                .uid(Integer.parseInt(parts[2]))
                                .gid(Integer.parseInt(parts[3]))
                                .gecos(parts[4])
                                .homeDir(parts[5])
                                .shell(parts[6])
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting user info for {}: {}", username, e.getMessage());
        }
        return Optional.empty();
    }
}
