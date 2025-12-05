package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.UserInfoDTO;

import java.util.List;
import java.util.Map;

public interface UserService {
    /**
     * 列出所有系統使用者
     */
    List<UserInfoDTO> listAllUsers();

    /**
     * 建立新使用者
     */
    boolean createUser(String username, String password, String shell, boolean createHome);

    /**
     * 刪除使用者
     */
    boolean deleteUser(String username, boolean removeHome);

    /**
     * 修改使用者密碼
     */
    boolean changePassword(String username, String newPassword);

    /**
     * 修改使用者 Shell
     */
    boolean changeShell(String username, String newShell);

    /**
     * 列出所有群組
     */
    List<Map<String, Object>> listAllGroups();

    /**
     * 取得使用者所屬群組
     */
    List<String> getUserGroups(String username);

    /**
     * 設定使用者群組
     */
    boolean setUserGroups(String username, List<String> groups);
}
