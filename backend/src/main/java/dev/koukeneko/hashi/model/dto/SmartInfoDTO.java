package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * S.M.A.R.T. 磁碟健康資訊
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartInfoDTO {

    /**
     * 磁碟裝置路徑
     */
    private String device;

    /**
     * 磁碟型號
     */
    private String model;

    /**
     * 序號
     */
    private String serial;

    /**
     * 整體健康狀態 (PASSED, FAILED, UNKNOWN)
     */
    private String healthStatus;

    /**
     * 溫度 (攝氏)
     */
    private Integer temperature;

    /**
     * 通電時間 (小時)
     */
    private Long powerOnHours;

    /**
     * 啟動次數
     */
    private Long powerCycleCount;

    /**
     * 重新分配的磁區數
     */
    private Long reallocatedSectorCount;

    /**
     * 是否支援 S.M.A.R.T.
     */
    private boolean smartSupported;

    /**
     * S.M.A.R.T. 是否已啟用
     */
    private boolean smartEnabled;

    /**
     * 關鍵屬性列表
     */
    private List<SmartAttributeDTO> attributes;
}
