package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDTO {
    private String username;
    private int uid;
    private int gid;
    private String homeDir;
    private String shell;
}
