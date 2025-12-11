package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

import java.util.List;

/**
 * 使用者資訊 DTO
 */
@Builder
public record UserInfoDTO(
        /** 使用者名稱 (e.g. "john") */
        String username,
        /** 使用者 ID (e.g. 1001) */
        int uid,
        /** 主要群組 ID (e.g. 1001) */
        int gid,
        /** 使用者全名/註解 (GECOS 欄位) */
        String gecos,
        /** 家目錄 (e.g. "/home/john") */
        String homeDir,
        /** 登入 Shell (e.g. "/bin/bash") */
        String shell,
        /** 所屬群組列表 */
        List<String> groups,
        /** 帳號是否被鎖定 */
        boolean locked,
        /** 帳號過期日期 (YYYY-MM-DD 或 null) */
        String expireDate,
        /** 最後登入時間 */
        String lastLogin) {
}
