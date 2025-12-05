package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordInfoDTO {
    private String username;
    private int minDays;        // 密碼最短使用天數
    private int maxDays;        // 密碼最長使用天數
    private int warnDays;       // 過期前警告天數
    private int inactiveDays;   // 過期後停用天數 (-1 = 無限制)
    private String expireDate;  // 帳號過期日期 (YYYY-MM-DD 或 "never")
    private String lastChange;  // 最後變更日期
    private boolean locked;     // 帳號是否被鎖定
}
