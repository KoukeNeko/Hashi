package dev.koukeneko.hashi.model.dto;

/**
 * FTP Server 資訊
 * 用於偵測和顯示已安裝的 FTP server
 */
public record FtpServerInfo(
    /** Server 類型: vsftpd, proftpd, pure-ftpd */
    String type,
    /** Systemd 服務名稱 */
    String serviceName,
    /** 設定檔路徑 */
    String configPath,
    /** 服務是否正在運行 */
    boolean running,
    /** 服務是否已啟用 (開機自動啟動) */
    boolean enabled
) {}
