package dev.koukeneko.hashi.service.platform.disk;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.koukeneko.hashi.model.dto.SystemDiskDTO;
import dev.koukeneko.hashi.model.dto.SystemPartitionDTO;
import dev.koukeneko.hashi.service.DiskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class LinuxDiskService implements DiskService {

    private final ObjectMapper objectMapper;

    @Override
    public List<SystemDiskDTO> listDisks() {
        try {
            // lsblk -J -b (JSON, bytes) -o (columns)
            ProcessBuilder pb = new ProcessBuilder(
                    "lsblk", "-J", "-b", "-o", "NAME,PATH,MODEL,SERIAL,SIZE,TYPE,RM,FSTYPE,MOUNTPOINT,UUID,LABEL");
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
                log.error("lsblk failed with exit code {}", exitCode);
                return Collections.emptyList();
            }

            return parseLsblkOutput(output.toString());

        } catch (Exception e) {
            log.error("Failed to list disks", e);
            return Collections.emptyList();
        }
    }

    private List<SystemDiskDTO> parseLsblkOutput(String jsonOutput) {
        List<SystemDiskDTO> disks = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(jsonOutput);
            JsonNode blockdevices = root.get("blockdevices");

            if (blockdevices != null && blockdevices.isArray()) {
                for (JsonNode device : blockdevices) {
                    // Only process actual disks, loop devices might be excluded or handled
                    // differently if needed
                    String type = device.path("type").asText();
                    if (!"disk".equals(type) && !"loop".equals(type))
                        continue;

                    SystemDiskDTO disk = SystemDiskDTO.builder()
                            .name(device.path("name").asText())
                            .path(device.path("path").asText())
                            .model(device.path("model").asText(null))
                            .serial(device.path("serial").asText(null))
                            .size(device.path("size").asLong(0))
                            .type(type)
                            .removable(device.path("rm").asBoolean(false))
                            .partitions(new ArrayList<>())
                            .build();

                    // Process children (partitions)
                    JsonNode children = device.get("children");
                    if (children != null && children.isArray()) {
                        for (JsonNode child : children) {
                            SystemPartitionDTO partition = SystemPartitionDTO.builder()
                                    .name(child.path("name").asText())
                                    .path(child.path("path").asText())
                                    .size(child.path("size").asLong(0))
                                    .fstype(child.path("fstype").asText(null))
                                    .mountpoint(child.path("mountpoint").asText(null))
                                    .uuid(child.path("uuid").asText(null))
                                    .label(child.path("label").asText(null))
                                    .build();
                            disk.getPartitions().add(partition);
                        }
                    }
                    disks.add(disk);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse lsblk output", e);
        }
        return disks;
    }

    @Override
    public void mount(String source, String target, String fstype, String options) {
        // Requires sudo privileges for mount
        List<String> command = new ArrayList<>();
        command.add("sudo");
        command.add("-n"); // Non-interactive
        command.add("mount");

        if (fstype != null && !fstype.isEmpty()) {
            command.add("-t");
            command.add(fstype);
        }

        if (options != null && !options.isEmpty()) {
            command.add("-o");
            command.add(options);
        }

        command.add(source);
        command.add(target);

        executeSudoCommand(command);
    }

    @Override
    public void unmount(String target) {
        List<String> command = List.of("sudo", "-n", "umount", target);
        executeSudoCommand(command);
    }

    @Override
    public void format(String device, String fstype, String label) {
        // Security check: simple validation to prevent obvious injections
        if (!device.startsWith("/dev/")) {
            throw new IllegalArgumentException("Invalid device path");
        }
        if (!fstype.matches("^[a-z0-9]+$")) {
            throw new IllegalArgumentException("Invalid filesystem type");
        }

        List<String> command = new ArrayList<>();
        command.add("sudo");
        command.add("-n");
        command.add("mkfs." + fstype);

        if (label != null && !label.isEmpty()) {
            command.add("-L");
            command.add(label);
        }

        command.add(device);

        executeSudoCommand(command);
    }

    private void executeSudoCommand(List<String> command) {
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                // If sudo fails (authentication required), it means setup-permissions.sh wasn't
                // run or configured correctly
                throw new RuntimeException("Command failed: " + String.join(" ", command) + ". Error: " + output);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to execute System command", e);
        }
    }
}
