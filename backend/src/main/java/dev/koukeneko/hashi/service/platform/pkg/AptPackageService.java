package dev.koukeneko.hashi.service.platform.pkg;

import dev.koukeneko.hashi.model.dto.PackageInfoDTO;
import dev.koukeneko.hashi.service.PackageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AptPackageService implements PackageService {

    @Override
    public List<PackageInfoDTO> searchPackages(String query) {
        List<PackageInfoDTO> packages = new ArrayList<>();
        // apt-cache search {query}
        // Output format: package - description
        try {
            List<String> output = executeCommandAndGetOutput("apt-cache", "search", query);
            for (String line : output) {
                String[] parts = line.split(" - ", 2);
                if (parts.length == 2) {
                    packages.add(new PackageInfoDTO(
                            parts[0].trim(),
                            "", // Version unknown in search summary
                            parts[1].trim(),
                            "unknown",
                            "" // Architecture unknown
                    ));
                }
            }
        } catch (Exception e) {
            log.error("Failed to search packages: {}", e.getMessage());
        }
        return packages;
    }

    @Override
    public List<PackageInfoDTO> listUpdates() {
        List<PackageInfoDTO> updates = new ArrayList<>();
        try {
            // apt list --upgradable
            // Output example:
            // Listing... Done
            // package/stable 1.2.3 amd64 [upgradable from: 1.0.0]
            List<String> output = executeCommandAndGetOutput("apt", "list", "--upgradable");

            for (String line : output) {
                if (line.startsWith("Listing...") || line.isEmpty())
                    continue;

                // Parse line: package/repo version arch ...
                String[] parts = line.split(" ");
                if (parts.length >= 3) {
                    String name = parts[0].split("/")[0];
                    String version = parts[1];
                    String arch = parts[2];

                    updates.add(new PackageInfoDTO(
                            name,
                            version,
                            "Update available",
                            "upgradable",
                            arch));
                }
            }
        } catch (Exception e) {
            log.error("Failed to list updates: {}", e.getMessage());
        }
        return updates;
    }

    @Override
    public boolean installPackage(String packageName) {
        return executeSudoCommand("apt-get", "install", "-y", packageName);
    }

    @Override
    public boolean removePackage(String packageName) {
        return executeSudoCommand("apt-get", "remove", "-y", packageName);
    }

    @Override
    public boolean upgradePackage(String packageName) {
        return executeSudoCommand("apt-get", "install", "--only-upgrade", "-y", packageName);
    }

    @Override
    public boolean updateCache() {
        return executeSudoCommand("apt-get", "update");
    }

    @Override
    public List<PackageInfoDTO> listInstalled() {
        List<PackageInfoDTO> packages = new ArrayList<>();
        try {
            // dpkg-query -W -f='${Package}\t${Version}\t${Architecture}\t${Status}\n'
            // Output: package\tversion\tarch\tstatus
            List<String> output = executeCommandAndGetOutput(
                    "dpkg-query", "-W", "-f=${Package}\t${Version}\t${Architecture}\t${db:Status-Abbrev}\n");

            for (String line : output) {
                if (line.isEmpty())
                    continue;

                String[] parts = line.split("\t");
                if (parts.length >= 3) {
                    String name = parts[0].trim();
                    String version = parts[1].trim();
                    String arch = parts[2].trim();
                    // Status is optional, default to "installed"
                    String status = parts.length >= 4 ? parts[3].trim() : "ii";

                    // Only include fully installed packages (status starts with "ii")
                    if (status.startsWith("ii")) {
                        packages.add(new PackageInfoDTO(
                                name,
                                version,
                                "Installed",
                                "installed",
                                arch));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to list installed packages: {}", e.getMessage());
        }
        return packages;
    }

    // ================== Helpers ==================

    private boolean executeSudoCommand(String... command) {
        try {
            List<String> cmd = new ArrayList<>();
            cmd.add("sudo");
            cmd.add("-n"); // Non-interactive (fail if password needed)
            cmd.addAll(List.of(command));

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Log output for debug
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("CMD OUT: {}", line);
                }
            }

            return process.waitFor(5, TimeUnit.MINUTES) && process.exitValue() == 0;
        } catch (Exception e) {
            log.error("Command execution failed: {}", e.getMessage());
            return false;
        }
    }

    private List<String> executeCommandAndGetOutput(String... command) {
        List<String> output = new ArrayList<>();
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                output = reader.lines().collect(Collectors.toList());
            }

            if (!process.waitFor(30, TimeUnit.SECONDS) || process.exitValue() != 0) {
                log.warn("Command finished with error or timeout: " + String.join(" ", command));
            }
        } catch (Exception e) {
            log.error("Failed to execute command: {}", e.getMessage());
        }
        return output;
    }
}
