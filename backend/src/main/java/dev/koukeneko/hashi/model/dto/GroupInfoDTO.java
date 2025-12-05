package dev.koukeneko.hashi.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupInfoDTO {
    private String name;          // 群組名稱
    private int gid;              // 群組 ID
    private List<String> members; // 成員列表
}
