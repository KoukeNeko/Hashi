package dev.koukeneko.hashi.service.platform.user;

import dev.koukeneko.hashi.model.dto.GroupInfoDTO;
import dev.koukeneko.hashi.model.dto.PasswordInfoDTO;
import dev.koukeneko.hashi.model.dto.UserInfoDTO;
import dev.koukeneko.hashi.service.UserService;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;

@Slf4j
public class LinuxUserManager implements UserService {

    // ==================== 輔助方法 ====================

    private int executeCommand(List<String> command) {
        try {
            log.debug("Executing command: {}", String.join(" ", command));
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 讀取輸出（避免阻塞）
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("Command output: {}", line);
                }
            }

            return process.waitFor();
        } catch (Exception e) {
            log.error("Error executing command: {}", e.getMessage());
            return -1;
        }
    }

    private String executeCommandWithOutput(List<String> command) {
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            process.waitFor();
            return output.toString().trim();
        } catch (Exception e) {
            log.error("Error executing command: {}", e.getMessage());
            return "";
        }
    }

    private boolean isUserLocked(String username) {
        String output = executeCommandWithOutput(Arrays.asList("passwd", "-S", username));
        if (!output.isEmpty()) {
            String[] parts = output.split("\\s+");
            if (parts.length >= 2) {
                return "L".equals(parts[1]) || "LK".equals(parts[1]);
            }
        }
        return false;
    }

    private String getLastLogin(String username) {
        String output = executeCommandWithOutput(Arrays.asList("lastlog", "-u", username));
        String[] lines = output.split("\n");
        if (lines.length >= 2) {
            String lastLine = lines[1].trim();
            if (lastLine.contains("Never logged in")) {
                return "Never";
            }
            String[] parts = lastLine.split("\\s+", 4);
            if (parts.length >= 4) {
                return parts[3];
            }
        }
        return null;
    }

    // ==================== 使用者查詢 ====================

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
                    String[] parts = line.split(":");
                    if (parts.length >= 7) {
                        String username = parts[0];
                        UserInfoDTO user = new UserInfoDTO(
                                username,
                                Integer.parseInt(parts[2]),
                                Integer.parseInt(parts[3]),
                                parts[4],
                                parts[5],
                                parts[6],
                                getUserGroups(username),
                                isUserLocked(username),
                                null,
                                null);
                        users.add(user);
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
    public UserInfoDTO getUser(String username) {
        String output = executeCommandWithOutput(Arrays.asList("getent", "passwd", username));
        if (!output.isEmpty()) {
            String[] parts = output.split(":");
            if (parts.length >= 7) {
                PasswordInfoDTO pwInfo = getPasswordInfo(username);
                String expireDate = pwInfo != null ? pwInfo.expireDate() : null;

                return new UserInfoDTO(
                        parts[0],
                        Integer.parseInt(parts[2]),
                        Integer.parseInt(parts[3]),
                        parts[4],
                        parts[5],
                        parts[6],
                        getUserGroups(username),
                        isUserLocked(username),
                        expireDate,
                        getLastLogin(username));
            }
        }
        return null;
    }

    @Override
    public PasswordInfoDTO getPasswordInfo(String username) {
        String output = executeCommandWithOutput(Arrays.asList("chage", "-l", username));
        if (output.isEmpty())
            return null;

        int minDays = 0;
        int maxDays = 99999;
        int warnDays = 7;
        int inactiveDays = -1;
        String expireDate = null;
        String lastChange = null;

        for (String line : output.split("\n")) {
            String[] parts = line.split(":\\s*", 2);
            if (parts.length < 2)
                continue;

            String key = parts[0].trim().toLowerCase();
            String value = parts[1].trim();

            if (key.contains("minimum")) {
                minDays = parseIntOrDefault(value, 0);
            } else if (key.contains("maximum")) {
                maxDays = parseIntOrDefault(value, 99999);
            } else if (key.contains("warning")) {
                warnDays = parseIntOrDefault(value, 7);
            } else if (key.contains("inactive")) {
                inactiveDays = parseIntOrDefault(value, -1);
            } else if (key.contains("account expires")) {
                expireDate = "never".equalsIgnoreCase(value) ? null : value;
            } else if (key.contains("last password change")) {
                lastChange = value;
            }
        }

        return new PasswordInfoDTO(
                username,
                minDays,
                maxDays,
                warnDays,
                inactiveDays,
                expireDate,
                lastChange,
                isUserLocked(username));
    }

    private int parseIntOrDefault(String value, int defaultValue) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    @Override
    public List<String> getAvailableShells() {
        List<String> shells = new ArrayList<>();
        try {
            List<String> lines = Files.readAllLines(Paths.get("/etc/shells"));
            for (String line : lines) {
                line = line.trim();
                if (!line.isEmpty() && !line.startsWith("#")) {
                    shells.add(line);
                }
            }
        } catch (IOException e) {
            log.error("Error reading /etc/shells: {}", e.getMessage());
            shells.addAll(Arrays.asList("/bin/bash", "/bin/sh", "/usr/bin/zsh", "/usr/sbin/nologin"));
        }
        return shells;
    }

    // ==================== 使用者管理 ====================

    @Override
    public boolean createUser(String username, String password, String shell, boolean createHome,
            Integer uid, Integer gid, List<String> groups, String gecos,
            String homeDir, boolean system, String expireDate) {
        try {
            List<String> cmd = new ArrayList<>(Arrays.asList("useradd"));

            if (createHome) {
                cmd.add("-m");
            } else {
                cmd.add("-M");
            }

            if (shell != null && !shell.isEmpty()) {
                cmd.add("-s");
                cmd.add(shell);
            }

            if (uid != null) {
                cmd.add("-u");
                cmd.add(String.valueOf(uid));
            }

            if (gid != null) {
                cmd.add("-g");
                cmd.add(String.valueOf(gid));
            }

            if (groups != null && !groups.isEmpty()) {
                cmd.add("-G");
                cmd.add(String.join(",", groups));
            }

            if (gecos != null && !gecos.isEmpty()) {
                cmd.add("-c");
                cmd.add(gecos);
            }

            if (homeDir != null && !homeDir.isEmpty()) {
                cmd.add("-d");
                cmd.add(homeDir);
            }

            if (system) {
                cmd.add("-r");
            }

            if (expireDate != null && !expireDate.isEmpty()) {
                cmd.add("-e");
                cmd.add(expireDate);
            }

            cmd.add(username);

            int exitCode = executeCommand(cmd);
            if (exitCode != 0) {
                log.error("Failed to create user {}", username);
                return false;
            }

            if (password != null && !password.isEmpty()) {
                return changePassword(username, password);
            }

            log.info("User {} created successfully", username);
            return true;
        } catch (Exception e) {
            log.error("Error creating user {}: {}", username, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean deleteUser(String username, boolean removeHome, boolean force) {
        List<String> cmd = new ArrayList<>(Arrays.asList("userdel"));
        if (removeHome) {
            cmd.add("-r");
        }
        if (force) {
            cmd.add("-f");
        }
        cmd.add(username);

        int exitCode = executeCommand(cmd);
        if (exitCode == 0) {
            log.info("User {} deleted successfully", username);
            return true;
        }
        log.error("Failed to delete user {}", username);
        return false;
    }

    @Override
    public boolean renameUser(String oldUsername, String newUsername) {
        int exitCode = executeCommand(Arrays.asList("usermod", "-l", newUsername, oldUsername));
        if (exitCode == 0) {
            log.info("User {} renamed to {}", oldUsername, newUsername);
            return true;
        }
        return false;
    }

    @Override
    public boolean changeUid(String username, int newUid) {
        int exitCode = executeCommand(Arrays.asList("usermod", "-u", String.valueOf(newUid), username));
        if (exitCode == 0) {
            log.info("UID changed for user {} to {}", username, newUid);
            return true;
        }
        return false;
    }

    @Override
    public boolean changePrimaryGroup(String username, String groupName) {
        int exitCode = executeCommand(Arrays.asList("usermod", "-g", groupName, username));
        if (exitCode == 0) {
            log.info("Primary group changed for user {} to {}", username, groupName);
            return true;
        }
        return false;
    }

    @Override
    public boolean changePrimaryGroup(String username, int gid) {
        int exitCode = executeCommand(Arrays.asList("usermod", "-g", String.valueOf(gid), username));
        if (exitCode == 0) {
            log.info("Primary group changed for user {} to GID {}", username, gid);
            return true;
        }
        return false;
    }

    @Override
    public boolean changeHomeDir(String username, String newHomeDir, boolean moveContents) {
        List<String> cmd = new ArrayList<>(Arrays.asList("usermod", "-d", newHomeDir));
        if (moveContents) {
            cmd.add("-m");
        }
        cmd.add(username);

        int exitCode = executeCommand(cmd);
        if (exitCode == 0) {
            log.info("Home directory changed for user {} to {}", username, newHomeDir);
            return true;
        }
        return false;
    }

    @Override
    public boolean changeShell(String username, String newShell) {
        int exitCode = executeCommand(Arrays.asList("chsh", "-s", newShell, username));
        if (exitCode == 0) {
            log.info("Shell changed for user {} to {}", username, newShell);
            return true;
        }
        return false;
    }

    @Override
    public boolean changeGecos(String username, String gecos) {
        int exitCode = executeCommand(Arrays.asList("chfn", "-f", gecos, username));
        if (exitCode == 0) {
            log.info("GECOS changed for user {} to {}", username, gecos);
            return true;
        }
        return false;
    }

    // ==================== 密碼管理 ====================

    @Override
    public boolean changePassword(String username, String newPassword) {
        try {
            ProcessBuilder pb = new ProcessBuilder("chpasswd");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            process.getOutputStream().write((username + ":" + newPassword + "\n").getBytes());
            process.getOutputStream().flush();
            process.getOutputStream().close();

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                log.info("Password changed for user {}", username);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Error changing password for user {}: {}", username, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean deletePassword(String username) {
        int exitCode = executeCommand(Arrays.asList("passwd", "-d", username));
        if (exitCode == 0) {
            log.info("Password deleted for user {}", username);
            return true;
        }
        return false;
    }

    @Override
    public boolean expirePassword(String username) {
        int exitCode = executeCommand(Arrays.asList("passwd", "-e", username));
        if (exitCode == 0) {
            log.info("Password expired for user {}", username);
            return true;
        }
        return false;
    }

    @Override
    public boolean setPasswordPolicy(String username, Integer minDays, Integer maxDays,
            Integer warnDays, Integer inactiveDays) {
        List<String> cmd = new ArrayList<>(Arrays.asList("chage"));

        if (minDays != null) {
            cmd.add("-m");
            cmd.add(String.valueOf(minDays));
        }
        if (maxDays != null) {
            cmd.add("-M");
            cmd.add(String.valueOf(maxDays));
        }
        if (warnDays != null) {
            cmd.add("-W");
            cmd.add(String.valueOf(warnDays));
        }
        if (inactiveDays != null) {
            cmd.add("-I");
            cmd.add(String.valueOf(inactiveDays));
        }

        cmd.add(username);

        int exitCode = executeCommand(cmd);
        if (exitCode == 0) {
            log.info("Password policy updated for user {}", username);
            return true;
        }
        return false;
    }

    // ==================== 帳號鎖定 ====================

    @Override
    public boolean lockUser(String username) {
        int exitCode = executeCommand(Arrays.asList("passwd", "-l", username));
        if (exitCode == 0) {
            log.info("User {} locked", username);
            return true;
        }
        return false;
    }

    @Override
    public boolean unlockUser(String username) {
        int exitCode = executeCommand(Arrays.asList("passwd", "-u", username));
        if (exitCode == 0) {
            log.info("User {} unlocked", username);
            return true;
        }
        return false;
    }

    @Override
    public boolean setExpireDate(String username, String expireDate) {
        List<String> cmd = new ArrayList<>(Arrays.asList("chage", "-E"));
        cmd.add(expireDate != null && !expireDate.isEmpty() ? expireDate : "-1");
        cmd.add(username);

        int exitCode = executeCommand(cmd);
        if (exitCode == 0) {
            log.info("Expire date set for user {} to {}", username, expireDate);
            return true;
        }
        return false;
    }

    // ==================== 群組查詢 ====================

    @Override
    public List<GroupInfoDTO> listAllGroups() {
        List<GroupInfoDTO> groups = new ArrayList<>();
        try {
            ProcessBuilder pb = new ProcessBuilder("getent", "group");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String[] parts = line.split(":");
                    if (parts.length >= 3) {
                        List<String> members = parts.length > 3 && !parts[3].isEmpty()
                                ? Arrays.asList(parts[3].split(","))
                                : new ArrayList<>();
                        GroupInfoDTO group = new GroupInfoDTO(
                                parts[0],
                                Integer.parseInt(parts[2]),
                                members);
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
    public GroupInfoDTO getGroup(String groupName) {
        String output = executeCommandWithOutput(Arrays.asList("getent", "group", groupName));
        if (!output.isEmpty()) {
            String[] parts = output.split(":");
            if (parts.length >= 3) {
                List<String> members = parts.length > 3 && !parts[3].isEmpty()
                        ? Arrays.asList(parts[3].split(","))
                        : new ArrayList<>();
                return new GroupInfoDTO(
                        parts[0],
                        Integer.parseInt(parts[2]),
                        members);
            }
        }
        return null;
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

    // ==================== 群組成員管理 ====================

    @Override
    public boolean setUserGroups(String username, List<String> groups) {
        String groupList = groups != null ? String.join(",", groups) : "";
        int exitCode = executeCommand(Arrays.asList("usermod", "-G", groupList, username));
        if (exitCode == 0) {
            log.info("Groups set for user {} to {}", username, groupList);
            return true;
        }
        return false;
    }

    @Override
    public boolean addUserToGroups(String username, List<String> groups) {
        if (groups == null || groups.isEmpty())
            return true;

        String groupList = String.join(",", groups);
        int exitCode = executeCommand(Arrays.asList("usermod", "-a", "-G", groupList, username));
        if (exitCode == 0) {
            log.info("User {} added to groups {}", username, groupList);
            return true;
        }
        return false;
    }

    // ==================== 群組管理 ====================

    @Override
    public boolean createGroup(String groupName, Integer gid, boolean system, List<String> users) {
        List<String> cmd = new ArrayList<>(Arrays.asList("groupadd"));

        if (gid != null) {
            cmd.add("-g");
            cmd.add(String.valueOf(gid));
        }

        if (system) {
            cmd.add("-r");
        }

        cmd.add(groupName);

        int exitCode = executeCommand(cmd);
        if (exitCode != 0) {
            log.error("Failed to create group {}", groupName);
            return false;
        }

        // 新增初始成員
        if (users != null && !users.isEmpty()) {
            for (String user : users) {
                addMemberToGroup(groupName, user);
            }
        }

        log.info("Group {} created", groupName);
        return true;
    }

    @Override
    public boolean deleteGroup(String groupName, boolean force) {
        List<String> cmd = new ArrayList<>(Arrays.asList("groupdel"));
        if (force) {
            cmd.add("-f");
        }
        cmd.add(groupName);

        int exitCode = executeCommand(cmd);
        if (exitCode == 0) {
            log.info("Group {} deleted", groupName);
            return true;
        }
        log.error("Failed to delete group {}", groupName);
        return false;
    }

    @Override
    public boolean renameGroup(String oldName, String newName) {
        int exitCode = executeCommand(Arrays.asList("groupmod", "-n", newName, oldName));
        if (exitCode == 0) {
            log.info("Group {} renamed to {}", oldName, newName);
            return true;
        }
        return false;
    }

    @Override
    public boolean changeGroupGid(String groupName, int newGid) {
        int exitCode = executeCommand(Arrays.asList("groupmod", "-g", String.valueOf(newGid), groupName));
        if (exitCode == 0) {
            log.info("GID changed for group {} to {}", groupName, newGid);
            return true;
        }
        return false;
    }

    @Override
    public boolean setGroupMembers(String groupName, List<String> members) {
        String memberList = members != null ? String.join(",", members) : "";
        int exitCode = executeCommand(Arrays.asList("gpasswd", "-M", memberList, groupName));
        if (exitCode == 0) {
            log.info("Members set for group {} to {}", groupName, memberList);
            return true;
        }
        return false;
    }

    @Override
    public boolean addMemberToGroup(String groupName, String username) {
        int exitCode = executeCommand(Arrays.asList("gpasswd", "-a", username, groupName));
        if (exitCode == 0) {
            log.info("User {} added to group {}", username, groupName);
            return true;
        }
        return false;
    }

    @Override
    public boolean removeMemberFromGroup(String groupName, String username) {
        int exitCode = executeCommand(Arrays.asList("gpasswd", "-d", username, groupName));
        if (exitCode == 0) {
            log.info("User {} removed from group {}", username, groupName);
            return true;
        }
        return false;
    }

    @Override
    public boolean setGroupAdmins(String groupName, List<String> admins) {
        String adminList = admins != null ? String.join(",", admins) : "";
        int exitCode = executeCommand(Arrays.asList("gpasswd", "-A", adminList, groupName));
        if (exitCode == 0) {
            log.info("Admins set for group {} to {}", groupName, adminList);
            return true;
        }
        return false;
    }
}
