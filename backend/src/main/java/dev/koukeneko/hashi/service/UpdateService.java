package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.UpdateInfoDTO;

/**
 * 更新檢查服務介面
 * 負責檢查 GitHub Releases API 以獲取最新版本資訊
 */
public interface UpdateService {

    /**
     * 獲取當前的更新資訊
     * 使用快取的資料，如果快取過期則自動重新檢查
     *
     * @return 更新資訊 DTO
     */
    UpdateInfoDTO getUpdateInfo();

    /**
     * 強制檢查更新
     * 忽略快取，直接查詢 GitHub Releases API
     *
     * @return 最新的更新資訊 DTO
     */
    UpdateInfoDTO checkForUpdates();
}
