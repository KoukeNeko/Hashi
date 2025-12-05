package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.GroupInfoDTO;
import dev.koukeneko.hashi.model.dto.PasswordInfoDTO;
import dev.koukeneko.hashi.model.dto.UserInfoDTO;

import java.util.List;

public interface UserService {
    // ==================== 使用者查詢 ====================
    
    /**
     * 列出所有系統使用者
     */
    List<UserInfoDTO> listAllUsers();

    /**
     * 取得單一使用者資訊
     */
    UserInfoDTO getUser(String username);

    /**
     * 取得使用者密碼資訊 (過期設定等)
     */
    PasswordInfoDTO getPasswordInfo(String username);

    /**
     * 取得可用的 Shell 列表
     */
    List<String> getAvailableShells();

    // ==================== 使用者管理 ====================
    
    /**
     * 建立新使用者
     * @param username   使用者名稱
     * @param password   密碼
     * @param shell      登入 Shell
     * @param createHome 是否建立家目錄
     * @param uid        指定 UID (null = 自動)
     * @param gid        指定主要 GID (null = 自動)
     * @param groups     附加群組列表
     * @param gecos      使用者全名/註解
     * @param homeDir    家目錄路徑 (null = 預設)
     * @param system     是否為系統帳號
     * @param expireDate 帳號過期日期 (YYYY-MM-DD 或 null)
     */
    boolean createUser(String username, String password, String shell, boolean createHome,
                       Integer uid, Integer gid, List<String> groups, String gecos,
                       String homeDir, boolean system, String expireDate);

    /**
     * 刪除使用者
     * @param username   使用者名稱
     * @param removeHome 是否刪除家目錄
     * @param force      是否強制刪除
     */
    boolean deleteUser(String username, boolean removeHome, boolean force);

    /**
     * 修改使用者名稱
     */
    boolean renameUser(String oldUsername, String newUsername);

    /**
     * 修改使用者 UID
     */
    boolean changeUid(String username, int newUid);

    /**
     * 修改使用者主要群組 (by group name)
     */
    boolean changePrimaryGroup(String username, String groupName);

    /**
     * 修改使用者主要群組 (by GID)
     */
    boolean changePrimaryGroup(String username, int gid);

    /**
     * 修改使用者家目錄
     * @param moveContents 是否搬移內容
     */
    boolean changeHomeDir(String username, String newHomeDir, boolean moveContents);

    /**
     * 修改使用者 Shell
     */
    boolean changeShell(String username, String newShell);

    /**
     * 修改使用者 GECOS (全名/註解)
     */
    boolean changeGecos(String username, String gecos);

    // ==================== 密碼管理 ====================
    
    /**
     * 修改使用者密碼
     */
    boolean changePassword(String username, String newPassword);

    /**
     * 刪除使用者密碼 (允許無密碼登入)
     */
    boolean deletePassword(String username);

    /**
     * 強制密碼過期 (下次登入需變更)
     */
    boolean expirePassword(String username);

    /**
     * 設定密碼過期策略
     */
    boolean setPasswordPolicy(String username, Integer minDays, Integer maxDays, 
                               Integer warnDays, Integer inactiveDays);

    // ==================== 帳號鎖定 ====================
    
    /**
     * 鎖定使用者帳號
     */
    boolean lockUser(String username);

    /**
     * 解鎖使用者帳號
     */
    boolean unlockUser(String username);

    /**
     * 設定帳號過期日期
     */
    boolean setExpireDate(String username, String expireDate);

    // ==================== 群組管理 ====================
    
    /**
     * 列出所有群組
     */
    List<GroupInfoDTO> listAllGroups();

    /**
     * 取得單一群組資訊
     */
    GroupInfoDTO getGroup(String groupName);

    /**
     * 取得使用者所屬群組
     */
    List<String> getUserGroups(String username);

    /**
     * 設定使用者附加群組 (取代現有)
     */
    boolean setUserGroups(String username, List<String> groups);

    /**
     * 新增使用者到群組
     */
    boolean addUserToGroups(String username, List<String> groups);

    /**
     * 建立群組
     * @param groupName 群組名稱
     * @param gid 指定 GID (null = 自動)
     * @param system 是否為系統群組
     * @param users 初始成員列表
     */
    boolean createGroup(String groupName, Integer gid, boolean system, List<String> users);

    /**
     * 刪除群組
     */
    boolean deleteGroup(String groupName, boolean force);

    /**
     * 修改群組名稱
     */
    boolean renameGroup(String oldName, String newName);

    /**
     * 修改群組 GID
     */
    boolean changeGroupGid(String groupName, int newGid);

    /**
     * 設定群組成員列表 (取代現有)
     */
    boolean setGroupMembers(String groupName, List<String> members);

    /**
     * 新增成員到群組
     */
    boolean addMemberToGroup(String groupName, String username);

    /**
     * 從群組移除成員
     */
    boolean removeMemberFromGroup(String groupName, String username);

    /**
     * 設定群組管理員
     */
    boolean setGroupAdmins(String groupName, List<String> admins);
}
