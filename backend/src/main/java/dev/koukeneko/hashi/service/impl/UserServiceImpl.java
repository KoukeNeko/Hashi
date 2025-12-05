package dev.koukeneko.hashi.service.impl;

import dev.koukeneko.hashi.model.dto.UserInfoDTO;
import dev.koukeneko.hashi.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    @Override
    public List<UserInfoDTO> listAllUsers() {
        List<UserInfoDTO> users = new ArrayList<>();
        try {
            ProcessBuilder pb = new ProcessBuilder("getent", "passwd");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    // 格式: username:x:uid:gid:gecos:home:shell
                    String[] parts = line.split(":");
                    if (parts.length >= 7) {
                        int uid = Integer.parseInt(parts[2]);
                        // 只顯示正常使用者 (UID >= 1000) 和 root (UID 0)
                        if (uid >= 1000 || uid == 0) {
                            UserInfoDTO user = new UserInfoDTO();
                            user.setUsername(parts[0]);
                            user.setUid(uid);
                            user.setGid(Integer.parseInt(parts[3]));
                            user.setHomeDir(parts[5]);
                            user.setShell(parts[6]);
                            users.add(user);
                        }
                    }
                }
            }
            process.waitFor();
        } catch (Exception e) {
            log.error("Error listing users: {}", e.getMessage());
        }
        return users;
    }

    @Override
    public boolean createUser(String username, String password, String shell, boolean createHome) {
        try {
            // 使用 useradd 建立使用者
            List<String> cmd = new ArrayList<>(Arrays.asList("useradd"));
            if (createHome) {
                cmd.add("-m"); // 建立家目錄
            }
            cmd.add("-s");
            cmd.add(shell);
            cmd.add(username);

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                log.error("Failed to create user {}", username);
                return false;
            }

            // 設定密碼
            return changePassword(username, password);
        } catch (Exception e) {
            log.error("Error creating user {}: {}", username, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean deleteUser(String username, boolean removeHome) {
        try {
            List<String> cmd = new ArrayList<>(Arrays.asList("userdel"));
            if (removeHome) {
                cmd.add("-r"); // 刪除家目錄
            }
            cmd.add(username);

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                log.info("User {} deleted successfully", username);
                return true;
            } else {
                log.error("Failed to delete user {}", username);
                return false;
            }
        } catch (Exception e) {
            log.error("Error deleting user {}: {}", username, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean changePassword(String username, String newPassword) {
        try {
            // 使用 chpasswd 修改密碼
            ProcessBuilder pb = new ProcessBuilder("chpasswd");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 寫入 username:password 格式
            process.getOutputStream().write((username + ":" + newPassword + "\n").getBytes());
            process.getOutputStream().flush();
            process.getOutputStream().close();

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                log.info("Password changed for user {}", username);
                return true;
            } else {
                log.error("Failed to change password for user {}", username);
                return false;
            }
        } catch (Exception e) {
            log.error("Error changing password for user {}: {}", username, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean changeShell(String username, String newShell) {
        try {
            ProcessBuilder pb = new ProcessBuilder("chsh", "-s", newShell, username);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                log.info("Shell changed for user {} to {}", username, newShell);
                return true;
            } else {
                log.error("Failed to change shell for user {}", username);
                return false;
            }
        } catch (Exception e) {
            log.error("Error changing shell for user {}: {}", username, e.getMessage());
            return false;
        }
    }

    @Override
    public List<Map<String, Object>> listAllGroups() {
        List<Map<String, Object>> groups = new ArrayList<>();
        try {
            ProcessBuilder pb = new ProcessBuilder("getent", "group");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    // 格式: groupname:x:gid:members
                    String[] parts = line.split(":");
                    if (parts.length >= 3) {
                        Map<String, Object> group = new HashMap<>();
                        group.put("name", parts[0]);
                        group.put("gid", Integer.parseInt(parts[2]));
                        group.put("members", parts.length > 3 && !parts[3].isEmpty() 
                            ? Arrays.asList(parts[3].split(",")) 
                            : new ArrayList<>());
                        groups.add(group);
                    }
                }
            }
            process.waitFor();
        } catch (Exception e) {
            log.error("Error listing groups: {}", e.getMessage());
        }
        return groups;
    }

    @Override
    public List<String> getUserGroups(String username) {
        List<String> groups = new ArrayList<>();
        try {
            ProcessBuilder pb = new ProcessBuilder("groups", username);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line = reader.readLine();
                if (line != null) {
                    // 格式: username : group1 group2 group3
                    String[] parts = line.split(":");
                    if (parts.length > 1) {
                        String[] groupNames = parts[1].trim().split("\\s+");
                        groups.addAll(Arrays.asList(groupNames));
                    }
                }
            }
            process.waitFor();
        } catch (Exception e) {
            log.error("Error getting groups for user {}: {}", username, e.getMessage());
        }
        return groups;
    }

    @Override
    public boolean setUserGroups(String username, List<String> groups) {
        try {
            // 使用 usermod -G 設定附加群組
            String groupList = String.join(",", groups);
            ProcessBuilder pb = new ProcessBuilder("usermod", "-G", groupList, username);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                log.info("Groups updated for user {}: {}", username, groupList);
                return true;
            } else {
                log.error("Failed to update groups for user {}", username);
                return false;
            }
        } catch (Exception e) {
            log.error("Error updating groups for user {}: {}", username, e.getMessage());
            return false;
        }
    }
}
