package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDTO {
    private String username; // e.g. "john"
    private int uid;         // e.g. 1001
    private int gid;         // e.g. 1001
    private String homeDir;  // e.g. "/home/john"
    private String shell;    // e.g. "/bin/bash"
}
