package dev.koukeneko.hashi.model.dto;

public record PackageInfoDTO(
        String name,
        String version,
        String description,
        String status, // "installed", "upgradable", "not_installed"
        String architecture) {
}
