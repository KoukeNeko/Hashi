package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.UserInfo;

import java.util.Optional;

public interface AuthService {
    /**
     * 使用 Linux PAM 驗證使用者
     * @param username 使用者名
     * @param password 密碼
     * @return 驗證成功返回使用者資訊，失敗返回 empty
     */
    Optional<UserInfo> authenticate(String username, String password);

    /**
     * 驗證使用者是否存在於系統中
     * @param username 使用者名
     * @return 使用者存在返回使用者資訊，否則返回 empty
     */
    Optional<UserInfo> validateUser(String username);
}
