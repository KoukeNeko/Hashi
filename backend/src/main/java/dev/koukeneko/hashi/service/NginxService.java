package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.*;

import java.util.List;

/**
 * Nginx 管理服務介面 提供 Virtual Host、SSL 憑證管理與服務控制
 */
public interface NginxService {

    // ==================== 服務控制 ====================

    /**
     * 取得 Nginx 服務狀態
     *
     * @return 服務狀態 DTO
     */
    NginxStatusDTO getStatus();

    /**
     * 重載 Nginx 設定
     *
     * @return 是否成功
     */
    boolean reload();

    /**
     * 驗證 Nginx 設定檔語法
     *
     * @return 驗證結果訊息
     */
    String testConfig();

    // ==================== Virtual Host 管理 ====================

    /**
     * 列出所有 Virtual Hosts
     *
     * @return Host 列表
     */
    List<NginxHostDTO> listHosts();

    /**
     * 取得單一 Host 設定
     *
     * @param name
     *            設定檔名稱
     * @return Host 設定，若不存在回傳 null
     */
    NginxHostDTO getHost(String name);

    /**
     * 取得 Host 設定檔內容
     *
     * @param name
     *            設定檔名稱
     * @return 設定檔純文字內容
     */
    String getHostConfig(String name);

    /**
     * 建立新的 Virtual Host
     *
     * @param request
     *            建立請求
     * @return 建立後的 Host 資訊
     */
    NginxHostDTO createHost(CreateNginxHostRequest request);

    /**
     * 更新 Host 設定檔內容
     *
     * @param name
     *            設定檔名稱
     * @param content
     *            新的設定檔內容
     * @return 是否成功
     */
    boolean updateHostConfig(String name, String content);

    /**
     * 刪除 Virtual Host
     *
     * @param name
     *            設定檔名稱
     * @return 是否成功
     */
    boolean deleteHost(String name);

    /**
     * 啟用 Virtual Host (建立 symlink 到 sites-enabled)
     *
     * @param name
     *            設定檔名稱
     * @return 是否成功
     */
    boolean enableHost(String name);

    /**
     * 停用 Virtual Host (移除 sites-enabled 中的 symlink)
     *
     * @param name
     *            設定檔名稱
     * @return 是否成功
     */
    boolean disableHost(String name);

    // ==================== SSL 憑證管理 ====================

    /**
     * 列出所有 SSL 憑證
     *
     * @return SSL 憑證列表
     */
    List<SslCertDTO> listCertificates();

    /**
     * 使用 Certbot 申請 SSL 憑證
     *
     * @param domain
     *            網域名稱
     * @param email
     *            管理員 Email
     * @return 是否成功
     */
    boolean requestCertbotCert(String domain, String email);

    /**
     * 使用 acme.sh 申請 SSL 憑證
     *
     * @param domain
     *            網域名稱
     * @param email
     *            管理員 Email
     * @return 是否成功
     */
    boolean requestAcmeCert(String domain, String email);
}
