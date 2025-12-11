package dev.koukeneko.hashi.service.platform.service;

import dev.koukeneko.hashi.model.dto.ServiceItemDTO;

import java.util.List;

/**
 * 系統服務管理介面 Linux: systemd/systemctl Windows: Windows Services (sc.exe / PowerShell)
 */
public interface ServiceManager {

    /**
     * 列出所有系統服務
     */
    List<ServiceItemDTO> listServices();

    /**
     * 控制服務（啟動/停止/重啟）
     *
     * @param serviceName
     *            服務名稱
     * @param action
     *            操作類型 (start/stop/restart)
     */
    void controlService(String serviceName, String action);
}
