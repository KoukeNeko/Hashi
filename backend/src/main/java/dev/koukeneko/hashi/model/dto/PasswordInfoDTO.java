package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

@Builder
public record PasswordInfoDTO(
        String username,    // 使用者名稱
        int minDays,        // 密碼最短使用天數
        int maxDays,        // 密碼最長使用天數
        int warnDays,       // 過期前警告天數
        int inactiveDays,   // 過期後停用天數 (-1 = 無限制)
        String expireDate,  // 帳號過期日期 (YYYY-MM-DD 或 "never")
        String lastChange,  // 最後變更日期
        boolean locked      // 帳號是否被鎖定
) {}
