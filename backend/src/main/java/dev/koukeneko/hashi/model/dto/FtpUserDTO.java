package dev.koukeneko.hashi.model.dto;

/**
 * FTP 使用者資訊
 */
public record FtpUserDTO(
    /** 使用者名稱 */
    String username,
    /** Home 目錄 */
    String homeDir,
    /** 是否啟用 */
    boolean enabled
) {}
