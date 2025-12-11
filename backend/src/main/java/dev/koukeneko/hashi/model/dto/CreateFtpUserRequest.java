package dev.koukeneko.hashi.model.dto;

/**
 * 新增 FTP 使用者請求
 */
public record CreateFtpUserRequest(
        /** 使用者名稱 */
        String username,
        /** 密碼 */
        String password,
        /** Home 目錄 (可選，為空時使用預設) */
        String homeDir) {
}
