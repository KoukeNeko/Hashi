package dev.koukeneko.hashi.service.platform.network;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.koukeneko.hashi.model.dto.NetworkInterfaceDTO;
import dev.koukeneko.hashi.service.NetworkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class LinuxNetworkService implements NetworkService {

    private final ObjectMapper objectMapper;

    @Override
    public List<NetworkInterfaceDTO> listInterfaces() {
        try {
            // ip -j addr (JSON output)
            ProcessBuilder pb = new ProcessBuilder("ip", "-j", "addr");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("ip addr failed with exit code {}", exitCode);
                return Collections.emptyList();
            }

            return objectMapper.readValue(output.toString(), new TypeReference<List<NetworkInterfaceDTO>>() {
            });

        } catch (Exception e) {
            log.error("Failed to list network interfaces", e);
            return Collections.emptyList();
        }
    }

    @Override
    public List<String> getDnsConfig() {
        java.util.List<String> nameservers = new java.util.ArrayList<>();
        try {
            java.nio.file.Path path = java.nio.file.Paths.get("/etc/resolv.conf");
            if (java.nio.file.Files.exists(path)) {
                List<String> lines = java.nio.file.Files.readAllLines(path);
                for (String line : lines) {
                    if (line.trim().startsWith("nameserver")) {
                        String[] parts = line.trim().split("\\s+");
                        if (parts.length > 1) {
                            nameservers.add(parts[1]);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to read /etc/resolv.conf", e);
        }
        return nameservers;
    }

    @Override
    public void updateDnsConfig(List<String> nameservers) {
        StringBuilder content = new StringBuilder();
        try {
            java.nio.file.Path path = java.nio.file.Paths.get("/etc/resolv.conf");
            if (java.nio.file.Files.exists(path)) {
                List<String> existing = java.nio.file.Files.readAllLines(path);
                for (String line : existing) {
                    if (!line.trim().startsWith("nameserver")) {
                        content.append(line).append("\n");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to read existing /etc/resolve.conf", e);
        }

        for (String ns : nameservers) {
            content.append("nameserver ").append(ns).append("\n");
        }

        try {
            ProcessBuilder pb = new ProcessBuilder("sudo", "/usr/bin/tee", "/etc/resolv.conf");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            try (java.io.OutputStream os = process.getOutputStream()) {
                os.write(content.toString().getBytes());
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String error = new String(process.getInputStream().readAllBytes());
                throw new RuntimeException("Failed to update DNS: " + error);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to execute sudo tee", e);
        }
    }

    @Override
    public void setInterfaceState(String interfaceName, String state) {
        String action = "up".equalsIgnoreCase(state) ? "connect" : "disconnect";
        runCommand("sudo", "nmcli", "device", action, interfaceName);
    }

    @Override
    public void configureInterface(String interfaceName, String ipv4Method, String ipAddress, String gateway) {
        // Find connection UUID for this device
        String uuid = findConnectionUuid(interfaceName);
        if (uuid == null) {
            throw new RuntimeException("No connection found for interface: " + interfaceName);
        }

        // Configure IPv4
        if ("auto".equalsIgnoreCase(ipv4Method) || "dhcp".equalsIgnoreCase(ipv4Method)) {
            runCommand("sudo", "nmcli", "con", "mod", uuid, "ipv4.method", "auto");
        } else {
            runCommand("sudo", "nmcli", "con", "mod", uuid, "ipv4.method", "manual", "ipv4.addresses", ipAddress);
            if (gateway != null && !gateway.isEmpty()) {
                runCommand("sudo", "nmcli", "con", "mod", uuid, "ipv4.gateway", gateway);
            }
        }

        // Apply changes
        runCommand("sudo", "nmcli", "con", "up", uuid);
    }

    private String findConnectionUuid(String interfaceName) {
        try {
            // Try active connections first
            String output = runCommand("nmcli", "-t", "-f", "UUID,DEVICE", "con", "show", "--active");
            for (String line : output.split("\n")) {
                String[] parts = line.split(":");
                if (parts.length >= 2 && parts[1].equals(interfaceName)) {
                    return parts[0];
                }
            }

            // Try all connections
            output = runCommand("nmcli", "-t", "-f", "UUID,DEVICE", "con", "show");
            for (String line : output.split("\n")) {
                String[] parts = line.split(":");
                if (parts.length >= 2 && parts[1].equals(interfaceName)) {
                    return parts[0];
                }
            }
        } catch (Exception e) {
            log.warn("Failed to find connection UUID for {}", interfaceName, e);
        }
        return null;
    }

    private String runCommand(String... command) {
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                // Ignore empty output if exit code is non-zero but we expected it? No, explicit
                // error.
                // But for nmcli show, it might return non-zero if no connections? Check later.
                // Actually process.waitFor() returns exit code.
                throw new RuntimeException(output.trim());
            }
            return output.trim();
        } catch (Exception e) {
            throw new RuntimeException("Command failed: " + e.getMessage(), e);
        }
    }
}
