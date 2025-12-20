package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * S.M.A.R.T. 屬性
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartAttributeDTO {

    /**
     * 屬性 ID
     */
    private int id;

    /**
     * 屬性名稱
     */
    private String name;

    /**
     * 目前值
     */
    private int value;

    /**
     * 最差值
     */
    private int worst;

    /**
     * 臨界值
     */
    private int threshold;

    /**
     * 原始值
     */
    private String rawValue;

    /**
     * 屬性類型 (Pre-fail, Old_age)
     */
    private String type;

    /**
     * 是否低於臨界值 (警告)
     */
    private boolean failing;
}
