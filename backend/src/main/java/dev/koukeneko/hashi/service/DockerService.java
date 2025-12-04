package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.ContainerDTO;

import java.util.List;

public interface DockerService {
    List<ContainerDTO> listContainers();
}
