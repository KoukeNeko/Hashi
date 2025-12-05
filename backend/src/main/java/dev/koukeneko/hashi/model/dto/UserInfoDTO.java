package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record UserInfoDTO(
        String username,    // 使用者名稱 (e.g. "john")
        int uid,            // 使用者 ID (e.g. 1001)
        int gid,            // 主要群組 ID (e.g. 1001)
        String gecos,       // 使用者全名/註解 (GECOS 欄位)
        String homeDir,     // 家目錄 (e.g. "/home/john")
        String shell,       // 登入 Shell (e.g. "/bin/bash")
        List<String> groups,// 所屬群組列表
        boolean locked,     // 帳號是否被鎖定
        String expireDate,  // 帳號過期日期 (YYYY-MM-DD 或 null)
        String lastLogin    // 最後登入時間
) {}
