package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.PackageInfoDTO;
import java.util.List;

public interface PackageService {
    List<PackageInfoDTO> searchPackages(String query);

    List<PackageInfoDTO> listUpdates();

    boolean installPackage(String packageName);

    boolean removePackage(String packageName);

    boolean upgradePackage(String packageName);

    boolean updateCache(); // apt update

    List<PackageInfoDTO> listInstalled();
}
