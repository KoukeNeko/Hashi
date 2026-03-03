package dev.koukeneko.hashi.model.dto;

import lombok.Data;

@Data
public class K8sApplyRequestDTO {
    private String manifest;
    private String defaultNamespace;
    private Boolean dryRun;
}
