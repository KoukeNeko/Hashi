package dev.koukeneko.hashi.service.platform.storage;

import dev.koukeneko.hashi.model.dto.StorageDiskDTO;
import dev.koukeneko.hashi.model.dto.StoragePoolDTO;
import dev.koukeneko.hashi.model.dto.request.CreatePoolRequest;
import dev.koukeneko.hashi.service.StoragePoolService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * mdadm 軟體 RAID 管理服務
 * 透過封裝 mdadm CLI 和解析 /proc/mdstat 實作
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MdadmPoolService implements StoragePoolService {

    private static final String PROVIDER_NAME = "mdadm";
    private static final Path MDSTAT_PATH = Path.of("/proc/mdstat");

    // 正規表達式模式
    private static final Pattern MD_DEVICE_PATTERN = Pattern.compile("^(md\\d+)\\s*:\\s*(\\w+)\\s+(\\w+)\\s+(.+)$");
    private static final Pattern BLOCKS_PATTERN = Pattern.compile("(\\d+)\\s+blocks");
    private static final Pattern REBUILD_PATTERN = Pattern.compile("\\[=*>\\.*\\]\\s+recovery\\s*=\\s*(\\d+\\.\\d+)%");
    private static final Pattern DISK_PATTERN = Pattern.compile("(\\w+)\\[(\\d+)\\](\\(S\\)|\\(F\\))?");

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public List<StoragePoolDTO> listPools() {
        List<StoragePoolDTO> pools = new ArrayList<>();
        try {
            if (!Files.exists(MDSTAT_PATH)) {
                log.debug("mdstat 不存在，可能沒有 RAID 陣列");
                return pools;
            }

            List<String> lines = Files.readAllLines(MDSTAT_PATH);
            StoragePoolDTO currentPool = null;

            for (String line : lines) {
                line = line.trim();

                // 解析 md 裝置行: md0 : active raid1 sdb1[1] sda1[0]
                Matcher deviceMatcher = MD_DEVICE_PATTERN.matcher(line);
                if (deviceMatcher.find()) {
                    if (currentPool != null) {
                        pools.add(currentPool);
                    }
                    currentPool = parseDeviceLine(deviceMatcher);
                    continue;
                }

                // 解析容量和狀態行
                if (currentPool != null && line.contains("blocks")) {
                    parseBlocksLine(line, currentPool);
                }

                // 解析重建進度
                if (currentPool != null && line.contains("recovery")) {
                    parseRebuildProgress(line, currentPool);
                }
            }

            if (currentPool != null) {
                pools.add(currentPool);
            }

            // 補充詳細資訊 (透過 mdadm --detail)
            for (StoragePoolDTO pool : pools) {
                enrichPoolDetails(pool);
            }

        } catch (Exception e) {
            log.error("解析 mdstat 失敗", e);
        }

        return pools;
    }

    private StoragePoolDTO parseDeviceLine(Matcher matcher) {
        String name = matcher.group(1);
        String state = matcher.group(2); // active, inactive
        String level = matcher.group(3); // raid0, raid1, raid5...
        String disksString = matcher.group(4);

        List<StorageDiskDTO> disks = new ArrayList<>();
        Matcher diskMatcher = DISK_PATTERN.matcher(disksString);
        int spareCount = 0;
        int faultyCount = 0;

        while (diskMatcher.find()) {
            String diskName = diskMatcher.group(1);
            int diskNumber = Integer.parseInt(diskMatcher.group(2));
            String flag = diskMatcher.group(3);

            String status = "active";
            if ("(S)".equals(flag)) {
                status = "spare";
                spareCount++;
            } else if ("(F)".equals(flag)) {
                status = "faulty";
                faultyCount++;
            }

            disks.add(StorageDiskDTO.builder()
                    .device("/dev/" + diskName)
                    .status(status)
                    .raidDiskNumber(diskNumber)
                    .build());
        }

        String poolStatus = "ONLINE";
        if ("inactive".equals(state)) {
            poolStatus = "OFFLINE";
        }

        return StoragePoolDTO.builder()
                .name(name)
                .device("/dev/" + name)
                .provider(PROVIDER_NAME)
                .level(level)
                .status(poolStatus)
                .diskCount(disks.size())
                .activeDiskCount(disks.size() - spareCount - faultyCount)
                .spareDiskCount(spareCount)
                .disks(disks)
                .build();
    }

    private void parseBlocksLine(String line, StoragePoolDTO pool) {
        Matcher blocksMatcher = BLOCKS_PATTERN.matcher(line);
        if (blocksMatcher.find()) {
            // blocks * 1024 = bytes
            long blocks = Long.parseLong(blocksMatcher.group(1));
            pool.setTotalSize(blocks * 1024);
        }

        // 檢查 degraded 狀態: [2/1] [U_]
        if (line.contains("[_") || line.contains("_]")) {
            pool.setStatus("DEGRADED");
        }
    }

    private void parseRebuildProgress(String line, StoragePoolDTO pool) {
        Matcher rebuildMatcher = REBUILD_PATTERN.matcher(line);
        if (rebuildMatcher.find()) {
            pool.setStatus("REBUILDING");
            pool.setRebuildProgress(Double.parseDouble(rebuildMatcher.group(1)));
        }
    }

    private void enrichPoolDetails(StoragePoolDTO pool) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "sudo", "-n", "mdadm", "--detail", pool.getDevice());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();

                    if (line.startsWith("UUID :")) {
                        pool.setUuid(line.split(":")[1].trim());
                    }
                    if (line.startsWith("Array Size :")) {
                        // Array Size : 1953381376 (1862.89 GiB 2000.26 GB)
                        String sizeStr = line.split(":")[1].trim().split("\\s+")[0];
                        pool.setTotalSize(Long.parseLong(sizeStr) * 1024);
                    }
                    if (line.startsWith("Used Dev Size :")) {
                        String sizeStr = line.split(":")[1].trim().split("\\s+")[0];
                        pool.setUsedSize(Long.parseLong(sizeStr) * 1024);
                    }
                }
            }

            process.waitFor();
        } catch (Exception e) {
            log.warn("取得 {} 詳細資訊失敗: {}", pool.getDevice(), e.getMessage());
        }
    }

    @Override
    public StoragePoolDTO getPool(String name) {
        return listPools().stream()
                .filter(p -> p.getName().equals(name) || p.getDevice().equals(name))
                .findFirst()
                .orElse(null);
    }

    @Override
    public void createPool(CreatePoolRequest request) {
        validateCreateRequest(request);

        List<String> command = new ArrayList<>();
        command.add("sudo");
        command.add("-n");
        command.add("mdadm");
        command.add("--create");
        command.add("/dev/" + request.getName());
        command.add("--level=" + request.getLevel().replace("raid", ""));
        command.add("--raid-devices=" + request.getDisks().size());

        // 新增主要磁碟
        command.addAll(request.getDisks());

        // 新增備用磁碟
        if (request.getSpareDisks() != null && !request.getSpareDisks().isEmpty()) {
            command.add("--spare-devices=" + request.getSpareDisks().size());
            command.addAll(request.getSpareDisks());
        }

        // 自動確認
        command.add("--run");

        executeCommand(command);
        log.info("已建立 RAID 陣列: /dev/{}", request.getName());

        // 選擇性格式化和掛載
        if (request.isFormatAndMount() && request.getMountPoint() != null) {
            formatAndMount(request);
        }
    }

    private void validateCreateRequest(CreatePoolRequest request) {
        String level = request.getLevel();
        int diskCount = request.getDisks().size();

        switch (level) {
            case "raid0":
                if (diskCount < 2) {
                    throw new IllegalArgumentException("RAID0 至少需要 2 顆磁碟");
                }
                break;
            case "raid1":
                if (diskCount < 2) {
                    throw new IllegalArgumentException("RAID1 至少需要 2 顆磁碟");
                }
                break;
            case "raid5":
                if (diskCount < 3) {
                    throw new IllegalArgumentException("RAID5 至少需要 3 顆磁碟");
                }
                break;
            case "raid6":
                if (diskCount < 4) {
                    throw new IllegalArgumentException("RAID6 至少需要 4 顆磁碟");
                }
                break;
            case "raid10":
                if (diskCount < 4 || diskCount % 2 != 0) {
                    throw new IllegalArgumentException("RAID10 至少需要 4 顆磁碟 (偶數)");
                }
                break;
            default:
                throw new IllegalArgumentException("不支援的 RAID 等級: " + level);
        }
    }

    private void formatAndMount(CreatePoolRequest request) {
        String filesystem = request.getFilesystem() != null ? request.getFilesystem() : "ext4";
        String device = "/dev/" + request.getName();
        String mountPoint = request.getMountPoint();

        // 格式化
        List<String> formatCmd = List.of("sudo", "-n", "mkfs." + filesystem, device);
        executeCommand(formatCmd);

        // 建立掛載點
        List<String> mkdirCmd = List.of("sudo", "-n", "mkdir", "-p", mountPoint);
        executeCommand(mkdirCmd);

        // 掛載
        List<String> mountCmd = List.of("sudo", "-n", "mount", device, mountPoint);
        executeCommand(mountCmd);

        log.info("已格式化 {} 為 {} 並掛載至 {}", device, filesystem, mountPoint);
    }

    @Override
    public void destroyPool(String name) {
        String device = name.startsWith("/dev/") ? name : "/dev/" + name;

        // 先停止陣列
        List<String> stopCmd = List.of("sudo", "-n", "mdadm", "--stop", device);
        executeCommand(stopCmd);

        // 移除 superblock
        StoragePoolDTO pool = getPool(name);
        if (pool != null && pool.getDisks() != null) {
            for (StorageDiskDTO disk : pool.getDisks()) {
                try {
                    List<String> zeroCmd = List.of("sudo", "-n", "mdadm", "--zero-superblock", disk.getDevice());
                    executeCommand(zeroCmd);
                } catch (Exception e) {
                    log.warn("清除 {} superblock 失敗: {}", disk.getDevice(), e.getMessage());
                }
            }
        }

        log.info("已刪除 RAID 陣列: {}", device);
    }

    @Override
    public void addDisk(String poolName, String diskDevice) {
        String device = poolName.startsWith("/dev/") ? poolName : "/dev/" + poolName;
        List<String> command = List.of("sudo", "-n", "mdadm", "--add", device, diskDevice);
        executeCommand(command);
        log.info("已新增磁碟 {} 至 {}", diskDevice, device);
    }

    @Override
    public void removeDisk(String poolName, String diskDevice) {
        String device = poolName.startsWith("/dev/") ? poolName : "/dev/" + poolName;
        List<String> command = List.of("sudo", "-n", "mdadm", "--remove", device, diskDevice);
        executeCommand(command);
        log.info("已從 {} 移除磁碟 {}", device, diskDevice);
    }

    @Override
    public void markDiskFaulty(String poolName, String diskDevice) {
        String device = poolName.startsWith("/dev/") ? poolName : "/dev/" + poolName;
        List<String> command = List.of("sudo", "-n", "mdadm", "--fail", device, diskDevice);
        executeCommand(command);
        log.info("已標記 {} 中的 {} 為故障", device, diskDevice);
    }

    private void executeCommand(List<String> command) {
        try {
            log.debug("執行命令: {}", String.join(" ", command));
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("命令執行失敗: " + output);
            }
        } catch (Exception e) {
            log.error("執行命令失敗: {}", String.join(" ", command), e);
            throw new RuntimeException("命令執行失敗", e);
        }
    }
}
