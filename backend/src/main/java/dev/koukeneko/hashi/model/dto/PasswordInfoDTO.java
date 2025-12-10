package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 使用者密碼資訊 DTO
 */
@Builder
public record PasswordInfoDTO(
                /** 使用者名稱 */
                String username,
                /** 密碼最短使用天數 */
                int minDays,
                /** 密碼最長使用天數 */
                int maxDays,
                /** 過期前警告天數 */
                int warnDays,
                /** 過期後停用天數 (-1 = 無限制) */
                int inactiveDays,
                /** 帳號過期日期 (YYYY-MM-DD 或 "never") */
                String expireDate,
                /** 最後變更日期 */
                String lastChange,
                /** 帳號是否被鎖定 */
                boolean locked) {
}
