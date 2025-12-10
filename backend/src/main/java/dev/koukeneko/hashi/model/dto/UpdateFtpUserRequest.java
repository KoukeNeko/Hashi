package dev.koukeneko.hashi.model.dto;

/**
 * 更新 FTP 使用者請求
 */
public record UpdateFtpUserRequest(
        /** 新密碼 (若為空則不修改) */
        String password,
        /** 新 Home 目錄 (若為空則不修改) */
        String homeDir,
        /** 是否移動舊目錄內容 */
        boolean moveContent) {
}
