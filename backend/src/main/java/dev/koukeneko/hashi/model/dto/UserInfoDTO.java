package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDTO {
    private String username;    // e.g. "john"
    private int uid;            // e.g. 1001
    private int gid;            // e.g. 1001
    private String gecos;       // 使用者全名/註解 (GECOS 欄位)
    private String homeDir;     // e.g. "/home/john"
    private String shell;       // e.g. "/bin/bash"
    private List<String> groups; // 所屬群組列表
    private boolean locked;     // 帳號是否被鎖定
    private String expireDate;  // 帳號過期日期 (YYYY-MM-DD 或 null)
    private String lastLogin;   // 最後登入時間
}
