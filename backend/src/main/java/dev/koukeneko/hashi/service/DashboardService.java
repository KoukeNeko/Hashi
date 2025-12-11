package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.SystemStatusDTO;

/**
 * 系統儀表板服務介面 提供系統狀態資訊 (CPU、RAM、Disk 等)
 */
public interface DashboardService {
    /**
     * 取得即時系統狀態
     *
     * @return 系統狀態 DTO
     */
    SystemStatusDTO getSystemStatus();
}
