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
                    // Only process actual disks and loop devices
                    String type = device.path("type").asText();
                    if (!"disk".equals(type) && !"loop".equals(type))
                        continue;

                    String diskModel = device.path("model").asText(null);
                    String diskSerial = device.path("serial").asText(null);

                    SystemDiskDTO disk = SystemDiskDTO.builder()
                            .name(device.path("name").asText())
                            .path(device.path("path").asText())
                            .model(diskModel)
                            .serial(diskSerial)
                            .size(device.path("size").asLong(0))
                            .type(type)
                            .removable(device.path("rm").asBoolean(false))
                            .partitions(new ArrayList<>())
                            .build();

                    // Process children (partitions)
                    JsonNode children = device.get("children");
                    if (children != null && children.isArray()) {
                        for (JsonNode child : children) {
                            String childType = child.path("type").asText();

                            // Add partition info to disk's partitions list
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

                            // Also add partition as a separate top-level entry for RAID selection
                            if ("part".equals(childType)) {
                                SystemDiskDTO partAsDisk = SystemDiskDTO.builder()
                                        .name(child.path("name").asText())
                                        .path(child.path("path").asText())
                                        .model(diskModel) // Inherit parent disk model
                                        .serial(diskSerial) // Inherit parent disk serial
                                        .size(child.path("size").asLong(0))
                                        .type("part")
                                        .removable(device.path("rm").asBoolean(false))
                                        .partitions(Collections.emptyList())
                                        .build();
                                disks.add(partAsDisk);
                            }
                        }
                    }
                    disks.add(disk);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse lsblk output", e);
        }

        // Sort: Physical disks first, then loop/others. Within type, sort by name.
        disks.sort((d1, d2) -> {
            boolean d1IsDisk = "disk".equals(d1.getType());
            boolean d2IsDisk = "disk".equals(d2.getType());

            if (d1IsDisk && !d2IsDisk)
                return -1;
            if (!d1IsDisk && d2IsDisk)
                return 1;

            return d1.getName().compareToIgnoreCase(d2.getName());
        });

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

    @Override
    public void createPartition(String diskPath, String fstype, String start, String end) {
        validateDiskPath(diskPath);

        // Detect partition table type
        String labelType = getPartitionTableType(diskPath);

        if ("loop".equals(labelType)) {
            throw new IllegalArgumentException("Cannot partition a 'loop' device (raw filesystem) on " + diskPath
                    + ". The disk behaves as a single large file. You must wipe/initialize it with a partition table (GPT/MBR) first.");
        }

        if ("unknown".equals(labelType)) {
            log.warn("Disk {} has unknown label, attempting to create partition (may fail if uninitialized)", diskPath);
        }

        List<String> command = new ArrayList<>();
        command.add("sudo");
        command.add("-n");
        command.add("parted");
        command.add("-s");
        command.add(diskPath);
        command.add("mkpart");

        if ("msdos".equals(labelType)) {
            // MBR syntax: mkpart primary FSTYPE START END
            command.add("primary");
        } else {
            // GPT syntax: mkpart PARTITION_NAME FSTYPE START END
            command.add("data"); // Partition label/name for GPT
        }

        if (fstype != null && !fstype.isEmpty()) {
            command.add(fstype);
        } else {
            command.add("ext4");
        }
        command.add(start);
        command.add(end);

        executeSudoCommand(command);
    }

    /**
     * Detect partition table type: gpt, msdos, loop, or unknown
     */
    private String getPartitionTableType(String diskPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "sudo", "-n", "parted", "-s", diskPath, "print");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            process.waitFor();

            String result = output.toString().toLowerCase();
            if (result.contains("partition table: gpt"))
                return "gpt";
            if (result.contains("partition table: msdos"))
                return "msdos";
            if (result.contains("partition table: loop"))
                return "loop";
            return "unknown";
        } catch (Exception e) {
            log.warn("Failed to detect partition table type for {}, assuming unknown", diskPath, e);
            return "unknown";
        }
    }

    @Override
    public void deletePartition(String diskPath, int partitionNumber) {
        validateDiskPath(diskPath);

        List<String> command = new ArrayList<>();
        command.add("sudo");
        command.add("-n");
        command.add("parted");
        command.add("-s");
        command.add(diskPath);
        command.add("rm");
        command.add(String.valueOf(partitionNumber));

        executeSudoCommand(command);
    }

    @Override
    public void resizePartition(String diskPath, int partitionNumber, String newEnd) {
        validateDiskPath(diskPath);

        // 1. Resize partition table
        List<String> partedCmd = new ArrayList<>();
        partedCmd.add("sudo");
        partedCmd.add("-n");
        partedCmd.add("parted");
        partedCmd.add("-s");
        partedCmd.add(diskPath);
        partedCmd.add("resizepart");
        partedCmd.add(String.valueOf(partitionNumber));
        partedCmd.add(newEnd);
        executeSudoCommand(partedCmd);

        // 2. Resize filesystem (Try resize2fs for ext4)
        // Construct partition path
        String partPath = diskPath;
        if (Character.isDigit(diskPath.charAt(diskPath.length() - 1))) {
            partPath += "p" + partitionNumber;
        } else {
            partPath += partitionNumber;
        }

        try {
            List<String> resizeCmd = new ArrayList<>();
            resizeCmd.add("sudo");
            resizeCmd.add("-n");
            resizeCmd.add("resize2fs");
            resizeCmd.add(partPath);
            executeSudoCommand(resizeCmd);
        } catch (Exception e) {
            log.warn("Failed to resize filesystem on {}, possibly not ext4 or mounted/busy. Manually verify.", partPath,
                    e);
            // Don't fail the whole operation if just fs resize fails, as partition resize
            // might have succeeded
        }
    }

    private void validateDiskPath(String path) {
        if (!path.startsWith("/dev/")) {
            throw new IllegalArgumentException("Invalid device path: " + path);
        }
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
