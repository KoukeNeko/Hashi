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

/**
 * 使用者與群組管理 Controller
 * 提供系統使用者、群組的增刪改查，以及密碼、Shell 等進階管理
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ==================== 使用者查詢 ====================

    /**
     * 列出所有系統使用者
     *
     * @return 使用者資訊列表
     */
    @GetMapping
    public ResponseEntity<List<UserInfoDTO>> listUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    /**
     * 取得特定使用者詳細資訊
     *
     * @param username 使用者名稱
     * @return 使用者詳細資訊，若無則回傳 404
     */
    @GetMapping("/{username}")
    public ResponseEntity<UserInfoDTO> getUser(@PathVariable String username) {
        UserInfoDTO user = userService.getUser(username);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * 取得使用者密碼資訊 (如過期時間、最後修改日)
     *
     * @param username 使用者名稱
     * @return 密碼資訊，若無則回傳 404
     */
    @GetMapping("/{username}/password-info")
    public ResponseEntity<PasswordInfoDTO> getPasswordInfo(@PathVariable String username) {
        PasswordInfoDTO info = userService.getPasswordInfo(username);
        if (info != null) {
            return ResponseEntity.ok(info);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * 取得系統可用的 Shell 列表
     *
     * @return Shell 路徑列表
     */
    @GetMapping("/shells")
    public ResponseEntity<List<String>> getAvailableShells() {
        return ResponseEntity.ok(userService.getAvailableShells());
    }

    // ==================== 使用者管理 ====================

    /**
     * 建立新使用者
     *
     * @param request 使用者建立請求參數
     * @return 建立結果與訊息
     */
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

    /**
     * 刪除使用者
     *
     * @param username   使用者名稱
     * @param removeHome 是否同時刪除 Home 目錄
     * @param force      是否強制刪除
     * @return 刪除結果與訊息
     */
    @DeleteMapping("/{username}")
    public ResponseEntity<Map<String, Object>> deleteUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "false") boolean removeHome,
            @RequestParam(defaultValue = "false") boolean force) {
        boolean success = userService.deleteUser(username, removeHome, force);
        return buildResponse(success, "User deleted successfully", "Failed to delete user");
    }

    /**
     * 重新命名使用者
     *
     * @param username 使用者名稱
     * @param request  包含新使用者名稱的請求
     * @return 重新命名結果
     */
    @PutMapping("/{username}/rename")
    public ResponseEntity<Map<String, Object>> renameUser(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String newUsername = request.get("newUsername");
        boolean success = userService.renameUser(username, newUsername);
        return buildResponse(success, "User renamed successfully", "Failed to rename user");
    }

    /**
     * 修改使用者 UID
     *
     * @param username 使用者名稱
     * @param request  包含新 UID 的請求
     * @return 修改結果
     */
    @PutMapping("/{username}/uid")
    public ResponseEntity<Map<String, Object>> changeUid(
            @PathVariable String username,
            @RequestBody Map<String, Integer> request) {
        int newUid = request.get("uid");
        boolean success = userService.changeUid(username, newUid);
        return buildResponse(success, "UID changed successfully", "Failed to change UID");
    }

    /**
     * 修改使用者主要群組
     *
     * @param username 使用者名稱
     * @param request  包含新群組資訊 (gid 或 group name) 的請求
     * @return 修改結果
     */
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

    /**
     * 修改使用者 Home 目錄
     *
     * @param username 使用者名稱
     * @param request  包含新目錄路徑與是否移動內容的請求
     * @return 修改結果
     */
    @PutMapping("/{username}/home")
    public ResponseEntity<Map<String, Object>> changeHomeDir(
            @PathVariable String username,
            @RequestBody Map<String, Object> request) {
        String newHomeDir = (String) request.get("homeDir");
        boolean moveContents = Boolean.parseBoolean(String.valueOf(request.getOrDefault("moveContents", "false")));
        boolean success = userService.changeHomeDir(username, newHomeDir, moveContents);
        return buildResponse(success, "Home directory changed successfully", "Failed to change home directory");
    }

    /**
     * 修改使用者 Shell
     *
     * @param username 使用者名稱
     * @param request  包含新 Shell 路徑的請求
     * @return 修改結果
     */
    @PutMapping("/{username}/shell")
    public ResponseEntity<Map<String, Object>> changeShell(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String newShell = request.get("shell");
        boolean success = userService.changeShell(username, newShell);
        return buildResponse(success, "Shell changed successfully", "Failed to change shell");
    }

    /**
     * 修改使用者 GECOS 資訊 (全名、電話等)
     *
     * @param username 使用者名稱
     * @param request  包含新 GECOS 字串的請求
     * @return 修改結果
     */
    @PutMapping("/{username}/gecos")
    public ResponseEntity<Map<String, Object>> changeGecos(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String gecos = request.get("gecos");
        boolean success = userService.changeGecos(username, gecos);
        return buildResponse(success, "GECOS changed successfully", "Failed to change GECOS");
    }

    // ==================== 密碼管理 ====================

    /**
     * 修改使用者密碼
     *
     * @param username 使用者名稱
     * @param request  包含新密碼的請求
     * @return 修改結果
     */
    @PutMapping("/{username}/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String newPassword = request.get("password");
        boolean success = userService.changePassword(username, newPassword);
        return buildResponse(success, "Password changed successfully", "Failed to change password");
    }

    /**
     * 刪除使用者密碼 (使帳號無密碼)
     *
     * @param username 使用者名稱
     * @return 刪除結果
     */
    @DeleteMapping("/{username}/password")
    public ResponseEntity<Map<String, Object>> deletePassword(@PathVariable String username) {
        boolean success = userService.deletePassword(username);
        return buildResponse(success, "Password deleted successfully", "Failed to delete password");
    }

    /**
     * 使使用者密碼立即過期 (下次登入需更換)
     *
     * @param username 使用者名稱
     * @return 設定結果
     */
    @PostMapping("/{username}/expire-password")
    public ResponseEntity<Map<String, Object>> expirePassword(@PathVariable String username) {
        boolean success = userService.expirePassword(username);
        return buildResponse(success, "Password expired successfully", "Failed to expire password");
    }

    /**
     * 設定使用者密碼策略 (過期天數等)
     *
     * @param username 使用者名稱
     * @param request  包含策略設定的請求 (minDays, maxDays, warnDays, inactiveDays)
     * @return 設定結果
     */
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

    /**
     * 鎖定使用者帳號
     *
     * @param username 使用者名稱
     * @return 鎖定結果
     */
    @PostMapping("/{username}/lock")
    public ResponseEntity<Map<String, Object>> lockUser(@PathVariable String username) {
        boolean success = userService.lockUser(username);
        return buildResponse(success, "User locked successfully", "Failed to lock user");
    }

    /**
     * 解鎖使用者帳號
     *
     * @param username 使用者名稱
     * @return 解鎖結果
     */
    @PostMapping("/{username}/unlock")
    public ResponseEntity<Map<String, Object>> unlockUser(@PathVariable String username) {
        boolean success = userService.unlockUser(username);
        return buildResponse(success, "User unlocked successfully", "Failed to unlock user");
    }

    /**
     * 設定帳號過期日期
     *
     * @param username 使用者名稱
     * @param request  包含過期日期 (YYYY-MM-DD) 的請求
     * @return 設定結果
     */
    @PutMapping("/{username}/expire-date")
    public ResponseEntity<Map<String, Object>> setExpireDate(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String expireDate = request.get("expireDate");
        boolean success = userService.setExpireDate(username, expireDate);
        return buildResponse(success, "Expire date set successfully", "Failed to set expire date");
    }

    // ==================== 群組查詢 ====================

    /**
     * 列出所有系統群組
     *
     * @return 群組資訊列表
     */
    @GetMapping("/groups")
    public ResponseEntity<List<GroupInfoDTO>> listGroups() {
        return ResponseEntity.ok(userService.listAllGroups());
    }

    /**
     * 取得特定群組詳細資訊
     *
     * @param groupName 群組名稱
     * @return 群組詳細資訊，若無則回傳 404
     */
    @GetMapping("/groups/{groupName}")
    public ResponseEntity<GroupInfoDTO> getGroup(@PathVariable String groupName) {
        GroupInfoDTO group = userService.getGroup(groupName);
        if (group != null) {
            return ResponseEntity.ok(group);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * 查詢使用者所屬的群組列表
     *
     * @param username 使用者名稱
     * @return 群組名稱列表
     */
    @GetMapping("/{username}/groups")
    public ResponseEntity<List<String>> getUserGroups(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserGroups(username));
    }

    // ==================== 群組成員管理 ====================

    /**
     * 設定使用者所屬的群組 (全量覆蓋)
     *
     * @param username 使用者名稱
     * @param request  包含群組名稱列表的請求
     * @return 設定結果
     */
    @PutMapping("/{username}/groups")
    public ResponseEntity<Map<String, Object>> setUserGroups(
            @PathVariable String username,
            @RequestBody Map<String, List<String>> request) {
        List<String> groups = request.get("groups");
        boolean success = userService.setUserGroups(username, groups);
        return buildResponse(success, "Groups updated successfully", "Failed to update groups");
    }

    /**
     * 將使用者加入指定群組 (附加模式)
     *
     * @param username 使用者名稱
     * @param request  包含要加入的群組名稱列表請求
     * @return 加入結果
     */
    @PostMapping("/{username}/groups")
    public ResponseEntity<Map<String, Object>> addUserToGroups(
            @PathVariable String username,
            @RequestBody Map<String, List<String>> request) {
        List<String> groups = request.get("groups");
        boolean success = userService.addUserToGroups(username, groups);
        return buildResponse(success, "User added to groups successfully", "Failed to add user to groups");
    }

    // ==================== 群組管理 ====================

    /**
     * 建立新群組
     *
     * @param request 群組建立請求參數
     * @return 建立結果
     */
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

    /**
     * 刪除群組
     *
     * @param groupName 群組名稱
     * @param force     是否強制刪除
     * @return 刪除結果
     */
    @DeleteMapping("/groups/{groupName}")
    public ResponseEntity<Map<String, Object>> deleteGroup(
            @PathVariable String groupName,
            @RequestParam(defaultValue = "false") boolean force) {
        boolean success = userService.deleteGroup(groupName, force);
        return buildResponse(success, "Group deleted successfully", "Failed to delete group");
    }

    /**
     * 重新命名群組
     *
     * @param groupName 群組名稱
     * @param request   包含新群組名稱的請求
     * @return 重新命名結果
     */
    @PutMapping("/groups/{groupName}/rename")
    public ResponseEntity<Map<String, Object>> renameGroup(
            @PathVariable String groupName,
            @RequestBody Map<String, String> request) {
        String newName = request.get("newName");
        boolean success = userService.renameGroup(groupName, newName);
        return buildResponse(success, "Group renamed successfully", "Failed to rename group");
    }

    /**
     * 修改群組 GID
     *
     * @param groupName 群組名稱
     * @param request   包含新 GID 的請求
     * @return 修改結果
     */
    @PutMapping("/groups/{groupName}/gid")
    public ResponseEntity<Map<String, Object>> changeGroupGid(
            @PathVariable String groupName,
            @RequestBody Map<String, Integer> request) {
        int newGid = request.get("gid");
        boolean success = userService.changeGroupGid(groupName, newGid);
        return buildResponse(success, "GID changed successfully", "Failed to change GID");
    }

    /**
     * 設定群組成員列表 (全量覆蓋)
     *
     * @param groupName 群組名稱
     * @param request   包含成員使用者名稱列表的請求
     * @return 設定結果
     */
    @PutMapping("/groups/{groupName}/members")
    public ResponseEntity<Map<String, Object>> setGroupMembers(
            @PathVariable String groupName,
            @RequestBody Map<String, List<String>> request) {
        List<String> members = request.get("members");
        boolean success = userService.setGroupMembers(groupName, members);
        return buildResponse(success, "Members updated successfully", "Failed to update members");
    }

    /**
     * 新增成員至群組
     *
     * @param groupName 群組名稱
     * @param request   包含使用者名稱的請求
     * @return 新增結果
     */
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

    /**
     * 從群組移除成員
     *
     * @param groupName 群組名稱
     * @param username  使用者名稱
     * @return 移除結果
     */
    @DeleteMapping("/groups/{groupName}/members/{username}")
    public ResponseEntity<Map<String, Object>> removeMemberFromGroup(
            @PathVariable String groupName,
            @PathVariable String username) {
        boolean success = userService.removeMemberFromGroup(groupName, username);
        return buildResponse(success, "Member removed successfully", "Failed to remove member");
    }

    /**
     * 設定群組管理員 (僅記錄，未實際賦權)
     *
     * @param groupName 群組名稱
     * @param request   包含管理員名稱列表的請求
     * @return 設定結果
     */
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
