package dev.koukeneko.hashi.model.dto;

import lombok.Data;

@Data
public class K8sScaleRequestDTO {
    private Integer replicas;
}
