package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.UserInfo;

import java.util.Optional;

public interface AuthService {
    /**
     * 使用 Linux PAM 驗證用戶
     * @param username 用戶名
     * @param password 密碼
     * @return 驗證成功返回用戶資訊，失敗返回 empty
     */
    Optional<UserInfo> authenticate(String username, String password);

    /**
     * 驗證用戶是否存在於系統中
     * @param username 用戶名
     * @return 用戶存在返回用戶資訊，否則返回 empty
     */
    Optional<UserInfo> validateUser(String username);
}
