package dev.koukeneko.hashi.service.impl;

import dev.koukeneko.hashi.model.dto.UserInfo;
import dev.koukeneko.hashi.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Optional;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

    @Override
    public Optional<UserInfo> authenticate(String username, String password) {
        try {
            // 使用 su 命令驗證密碼
            // su -c "exit" username 會要求輸入密碼，如果密碼正確就成功退出
            ProcessBuilder pb = new ProcessBuilder("su", "-c", "exit", username);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 將密碼寫入 stdin
            process.getOutputStream().write((password + "\n").getBytes());
            process.getOutputStream().flush();
            process.getOutputStream().close();

            // 等待行程結束
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
    public Optional<UserInfo> validateUser(String username) {
        return getUserInfo(username);
    }

    /**
     * 從 /etc/passwd 獲取使用者資訊
     */
    private Optional<UserInfo> getUserInfo(String username) {
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
                        UserInfo user = new UserInfo();
                        user.setUsername(parts[0]);
                        user.setUid(Integer.parseInt(parts[2]));
                        user.setGid(Integer.parseInt(parts[3]));
                        user.setHomeDir(parts[5]);
                        user.setShell(parts[6]);
                        return Optional.of(user);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting user info for {}: {}", username, e.getMessage());
        }
        return Optional.empty();
    }
}
