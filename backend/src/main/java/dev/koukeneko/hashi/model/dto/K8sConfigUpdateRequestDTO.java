package dev.koukeneko.hashi.model.dto;

import lombok.Data;

@Data
public class K8sConfigUpdateRequestDTO {
    private String kubeconfigPath;
}
