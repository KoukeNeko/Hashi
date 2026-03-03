package dev.koukeneko.hashi.model.dto;

import lombok.Data;

@Data
public class K8sConfigTestRequestDTO {
    private String kubeconfigPath;
}
