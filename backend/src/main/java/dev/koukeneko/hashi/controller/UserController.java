package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.GroupInfoDTO;
import dev.koukeneko.hashi.model.dto.PasswordInfoDTO;
import dev.koukeneko.hashi.model.dto.UserInfoDTO;
import dev.koukeneko.hashi.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ==================== 使用者查詢 ====================

    @GetMapping
    public ResponseEntity<List<UserInfoDTO>> listUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserInfoDTO> getUser(@PathVariable String username) {
        UserInfoDTO user = userService.getUser(username);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{username}/password-info")
    public ResponseEntity<PasswordInfoDTO> getPasswordInfo(@PathVariable String username) {
        PasswordInfoDTO info = userService.getPasswordInfo(username);
        if (info != null) {
            return ResponseEntity.ok(info);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/shells")
    public ResponseEntity<List<String>> getAvailableShells() {
        return ResponseEntity.ok(userService.getAvailableShells());
    }

    // ==================== 使用者管理 ====================

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, Object> request) {
        String username = (String) request.get("username");
        String password = (String) request.get("password");
        String shell = (String) request.getOrDefault("shell", "/bin/bash");
        boolean createHome = Boolean.parseBoolean(String.valueOf(request.getOrDefault("createHome", "true")));
        Integer uid = request.get("uid") != null ? Integer.parseInt(String.valueOf(request.get("uid"))) : null;
        Integer gid = request.get("gid") != null ? Integer.parseInt(String.valueOf(request.get("gid"))) : null;
        @SuppressWarnings("unchecked")
        List<String> groups = (List<String>) request.get("groups");
        String gecos = (String) request.get("gecos");
        String homeDir = (String) request.get("homeDir");
        boolean system = Boolean.parseBoolean(String.valueOf(request.getOrDefault("system", "false")));
        String expireDate = (String) request.get("expireDate");

        boolean success = userService.createUser(username, password, shell, createHome, 
                                                  uid, gid, groups, gecos, homeDir, system, expireDate);
        return buildResponse(success, "User created successfully", "Failed to create user");
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<Map<String, Object>> deleteUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "false") boolean removeHome,
            @RequestParam(defaultValue = "false") boolean force) {
        boolean success = userService.deleteUser(username, removeHome, force);
        return buildResponse(success, "User deleted successfully", "Failed to delete user");
    }

    @PutMapping("/{username}/rename")
    public ResponseEntity<Map<String, Object>> renameUser(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String newUsername = request.get("newUsername");
        boolean success = userService.renameUser(username, newUsername);
        return buildResponse(success, "User renamed successfully", "Failed to rename user");
    }

    @PutMapping("/{username}/uid")
    public ResponseEntity<Map<String, Object>> changeUid(
            @PathVariable String username,
            @RequestBody Map<String, Integer> request) {
        int newUid = request.get("uid");
        boolean success = userService.changeUid(username, newUid);
        return buildResponse(success, "UID changed successfully", "Failed to change UID");
    }

    @PutMapping("/{username}/primary-group")
    public ResponseEntity<Map<String, Object>> changePrimaryGroup(
            @PathVariable String username,
            @RequestBody Map<String, Object> request) {
        // 支援 gid 或 group name
        boolean success;
        if (request.containsKey("gid")) {
            int gid = Integer.parseInt(String.valueOf(request.get("gid")));
            success = userService.changePrimaryGroup(username, gid);
        } else {
            String groupName = (String) request.get("group");
            success = userService.changePrimaryGroup(username, groupName);
        }
        return buildResponse(success, "Primary group changed successfully", "Failed to change primary group");
    }

    @PutMapping("/{username}/home")
    public ResponseEntity<Map<String, Object>> changeHomeDir(
            @PathVariable String username,
            @RequestBody Map<String, Object> request) {
        String newHomeDir = (String) request.get("homeDir");
        boolean moveContents = Boolean.parseBoolean(String.valueOf(request.getOrDefault("moveContents", "false")));
        boolean success = userService.changeHomeDir(username, newHomeDir, moveContents);
        return buildResponse(success, "Home directory changed successfully", "Failed to change home directory");
    }

    @PutMapping("/{username}/shell")
    public ResponseEntity<Map<String, Object>> changeShell(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String newShell = request.get("shell");
        boolean success = userService.changeShell(username, newShell);
        return buildResponse(success, "Shell changed successfully", "Failed to change shell");
    }

    @PutMapping("/{username}/gecos")
    public ResponseEntity<Map<String, Object>> changeGecos(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String gecos = request.get("gecos");
        boolean success = userService.changeGecos(username, gecos);
        return buildResponse(success, "GECOS changed successfully", "Failed to change GECOS");
    }

    // ==================== 密碼管理 ====================

    @PutMapping("/{username}/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String newPassword = request.get("password");
        boolean success = userService.changePassword(username, newPassword);
        return buildResponse(success, "Password changed successfully", "Failed to change password");
    }

    @DeleteMapping("/{username}/password")
    public ResponseEntity<Map<String, Object>> deletePassword(@PathVariable String username) {
        boolean success = userService.deletePassword(username);
        return buildResponse(success, "Password deleted successfully", "Failed to delete password");
    }

    @PostMapping("/{username}/expire-password")
    public ResponseEntity<Map<String, Object>> expirePassword(@PathVariable String username) {
        boolean success = userService.expirePassword(username);
        return buildResponse(success, "Password expired successfully", "Failed to expire password");
    }

    @PutMapping("/{username}/password-policy")
    public ResponseEntity<Map<String, Object>> setPasswordPolicy(
            @PathVariable String username,
            @RequestBody Map<String, Integer> request) {
        Integer minDays = request.get("minDays");
        Integer maxDays = request.get("maxDays");
        Integer warnDays = request.get("warnDays");
        Integer inactiveDays = request.get("inactiveDays");
        boolean success = userService.setPasswordPolicy(username, minDays, maxDays, warnDays, inactiveDays);
        return buildResponse(success, "Password policy updated successfully", "Failed to update password policy");
    }

    // ==================== 帳號鎖定 ====================

    @PostMapping("/{username}/lock")
    public ResponseEntity<Map<String, Object>> lockUser(@PathVariable String username) {
        boolean success = userService.lockUser(username);
        return buildResponse(success, "User locked successfully", "Failed to lock user");
    }

    @PostMapping("/{username}/unlock")
    public ResponseEntity<Map<String, Object>> unlockUser(@PathVariable String username) {
        boolean success = userService.unlockUser(username);
        return buildResponse(success, "User unlocked successfully", "Failed to unlock user");
    }

    @PutMapping("/{username}/expire-date")
    public ResponseEntity<Map<String, Object>> setExpireDate(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String expireDate = request.get("expireDate");
        boolean success = userService.setExpireDate(username, expireDate);
        return buildResponse(success, "Expire date set successfully", "Failed to set expire date");
    }

    // ==================== 群組查詢 ====================

    @GetMapping("/groups")
    public ResponseEntity<List<GroupInfoDTO>> listGroups() {
        return ResponseEntity.ok(userService.listAllGroups());
    }

    @GetMapping("/groups/{groupName}")
    public ResponseEntity<GroupInfoDTO> getGroup(@PathVariable String groupName) {
        GroupInfoDTO group = userService.getGroup(groupName);
        if (group != null) {
            return ResponseEntity.ok(group);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{username}/groups")
    public ResponseEntity<List<String>> getUserGroups(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserGroups(username));
    }

    // ==================== 群組成員管理 ====================

    @PutMapping("/{username}/groups")
    public ResponseEntity<Map<String, Object>> setUserGroups(
            @PathVariable String username,
            @RequestBody Map<String, List<String>> request) {
        List<String> groups = request.get("groups");
        boolean success = userService.setUserGroups(username, groups);
        return buildResponse(success, "Groups updated successfully", "Failed to update groups");
    }

    @PostMapping("/{username}/groups")
    public ResponseEntity<Map<String, Object>> addUserToGroups(
            @PathVariable String username,
            @RequestBody Map<String, List<String>> request) {
        List<String> groups = request.get("groups");
        boolean success = userService.addUserToGroups(username, groups);
        return buildResponse(success, "User added to groups successfully", "Failed to add user to groups");
    }

    // ==================== 群組管理 ====================

    @PostMapping("/groups")
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody Map<String, Object> request) {
        String groupName = (String) request.get("name");
        if (groupName == null || groupName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Group name is required"));
        }
        Integer gid = request.get("gid") != null ? Integer.parseInt(String.valueOf(request.get("gid"))) : null;
        boolean system = Boolean.parseBoolean(String.valueOf(request.getOrDefault("system", "false")));
        @SuppressWarnings("unchecked")
        List<String> users = (List<String>) request.get("users");
        
        boolean success = userService.createGroup(groupName, gid, system, users);
        return buildResponse(success, "Group created successfully", "Failed to create group");
    }

    @DeleteMapping("/groups/{groupName}")
    public ResponseEntity<Map<String, Object>> deleteGroup(
            @PathVariable String groupName,
            @RequestParam(defaultValue = "false") boolean force) {
        boolean success = userService.deleteGroup(groupName, force);
        return buildResponse(success, "Group deleted successfully", "Failed to delete group");
    }

    @PutMapping("/groups/{groupName}/rename")
    public ResponseEntity<Map<String, Object>> renameGroup(
            @PathVariable String groupName,
            @RequestBody Map<String, String> request) {
        String newName = request.get("newName");
        boolean success = userService.renameGroup(groupName, newName);
        return buildResponse(success, "Group renamed successfully", "Failed to rename group");
    }

    @PutMapping("/groups/{groupName}/gid")
    public ResponseEntity<Map<String, Object>> changeGroupGid(
            @PathVariable String groupName,
            @RequestBody Map<String, Integer> request) {
        int newGid = request.get("gid");
        boolean success = userService.changeGroupGid(groupName, newGid);
        return buildResponse(success, "GID changed successfully", "Failed to change GID");
    }

    @PutMapping("/groups/{groupName}/members")
    public ResponseEntity<Map<String, Object>> setGroupMembers(
            @PathVariable String groupName,
            @RequestBody Map<String, List<String>> request) {
        List<String> members = request.get("members");
        boolean success = userService.setGroupMembers(groupName, members);
        return buildResponse(success, "Members updated successfully", "Failed to update members");
    }

    @PostMapping("/groups/{groupName}/members")
    public ResponseEntity<Map<String, Object>> addMemberToGroup(
            @PathVariable String groupName,
            @RequestBody Map<String, String> request) {
        String username = request.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username is required"));
        }
        boolean success = userService.addMemberToGroup(groupName, username);
        return buildResponse(success, "Member added successfully", "Failed to add member");
    }

    @DeleteMapping("/groups/{groupName}/members/{username}")
    public ResponseEntity<Map<String, Object>> removeMemberFromGroup(
            @PathVariable String groupName,
            @PathVariable String username) {
        boolean success = userService.removeMemberFromGroup(groupName, username);
        return buildResponse(success, "Member removed successfully", "Failed to remove member");
    }

    @PutMapping("/groups/{groupName}/admins")
    public ResponseEntity<Map<String, Object>> setGroupAdmins(
            @PathVariable String groupName,
            @RequestBody Map<String, List<String>> request) {
        List<String> admins = request.get("admins");
        boolean success = userService.setGroupAdmins(groupName, admins);
        return buildResponse(success, "Admins updated successfully", "Failed to update admins");
    }

    // ==================== 輔助方法 ====================

    private ResponseEntity<Map<String, Object>> buildResponse(boolean success, String successMsg, String failMsg) {
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", successMsg));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", failMsg));
        }
    }
}
