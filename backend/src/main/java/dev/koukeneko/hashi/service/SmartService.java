package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.SmartInfoDTO;

import java.util.List;

/**
 * S.M.A.R.T. 硬碟健康監測服務
 */
public interface SmartService {

    /**
     * 取得磁碟健康摘要資訊
     */
    SmartInfoDTO getHealth(String device);

    /**
     * 列出所有磁碟的健康狀態
     */
    List<SmartInfoDTO> listAllHealth();

    /**
     * 執行 S.M.A.R.T. 自我測試
     * 
     * @param device   磁碟裝置路徑
     * @param testType "short" 或 "long"
     */
    void runTest(String device, String testType);
}
