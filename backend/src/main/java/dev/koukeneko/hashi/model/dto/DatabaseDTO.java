package dev.koukeneko.hashi.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DatabaseDTO {
    private String id;
    private String name;
    private String type; // MySQL, PostgreSQL
    private String username;
    private String size;
    private String status; // online, offline
    private String backup;
}
