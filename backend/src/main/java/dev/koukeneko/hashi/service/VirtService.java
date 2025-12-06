package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.CreateVmDTO;
import dev.koukeneko.hashi.model.dto.IsoFileDTO;
import dev.koukeneko.hashi.model.dto.VmDTO;
import dev.koukeneko.hashi.model.dto.VncInfoDTO;
import org.libvirt.Connect;
import org.libvirt.Domain;
import org.libvirt.DomainInfo;
import org.libvirt.LibvirtException;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class VirtService {

    private static final String DISK_BASE_PATH = "/var/lib/libvirt/images";

    // 連線到本地 KVM
    // 注意：Connect 物件非執行緒安全，且持有底層連線，建議每次操作短暫連線或使用 Connection Pool
    // 這裡為了簡單，採用 "每次請求建立連線" 模式 (Stateless)
    private Connect connect() throws LibvirtException {
        // qemu:///system 代表連線到系統級的 KVM
        // 唯讀模式 false (我們要控制開關機)
        return new Connect("qemu:///system", false);
    }

    public List<VmDTO> listVms() {
        List<VmDTO> vms = new ArrayList<>();
        Connect conn = null;
        try {
            conn = connect();

            // 1. 獲取所有定義的 VM (包含關機的)
            // Libvirt API 比較老舊，需要分別列出 ID (執行中) 和 Name (所有)
            // 這裡我們直接列出所有定義的 Domain
            String[] definedDomains = conn.listDefinedDomains(); // 關機的
            int[] activeDomains = conn.listDomains();            // 開機的

            // 處理執行中的
            for (int id : activeDomains) {
                Domain domain = conn.domainLookupByID(id);
                vms.add(mapToDTO(domain));
            }

            // 處理關機的
            for (String name : definedDomains) {
                Domain domain = conn.domainLookupByName(name);
                vms.add(mapToDTO(domain));
            }

        } catch (LibvirtException e) {
            e.printStackTrace();
        } finally {
            close(conn);
        }
        return vms;
    }

    // 控制 VM
    public void controlVm(String name, String action) {
        Connect conn = null;
        try {
            conn = connect();
            Domain domain = conn.domainLookupByName(name);

            switch (action) {
                case "start":
                    if (!(domain.isActive() == 1)) domain.create(); // create = boot up
                    break;
                case "stop": // 優雅關機 (ACPI Shutdown)
                    if (domain.isActive() == 1) domain.shutdown();
                    break;
                case "force-stop": // 拔電源
                    if (domain.isActive() == 1) domain.destroy();
                    break;
                case "reboot":
                    domain.reboot(0);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown action: " + action);
            }
        } catch (LibvirtException e) {
            throw new RuntimeException("KVM Action Failed", e);
        } finally {
            close(conn);
        }
    }

    // 取得 VM 的 VNC 連線資訊
    public VncInfoDTO getVncInfo(String name) {
        Connect conn = null;
        try {
            conn = connect();
            Domain domain = conn.domainLookupByName(name);
            
            if (domain.isActive() != 1) {
                throw new IllegalStateException("VM is not running");
            }

            // 從 XML 中解析 VNC 資訊
            String xml = domain.getXMLDesc(0);
            
            // 解析 VNC port
            int port = -1;
            String password = null;
            
            // 簡單的 XML 解析（找 graphics type='vnc'）
            java.util.regex.Pattern portPattern = java.util.regex.Pattern.compile(
                    "<graphics[^>]*type=['\"]vnc['\"][^>]*port=['\"](-?\\d+)['\"]"
            );
            java.util.regex.Matcher portMatcher = portPattern.matcher(xml);
            if (portMatcher.find()) {
                port = Integer.parseInt(portMatcher.group(1));
            }
            
            // 如果 port 是 -1，代表 autoport，需要從 libvirt 取得實際 port
            if (port == -1) {
                // libvirt 會動態分配，通常從 5900 開始
                // 需要重新解析執行中的 XML
                String liveXml = domain.getXMLDesc(1); // VIR_DOMAIN_XML_SECURE
                portMatcher = portPattern.matcher(liveXml);
                if (portMatcher.find()) {
                    port = Integer.parseInt(portMatcher.group(1));
                }
            }

            // 解析密碼 (如果有)
            java.util.regex.Pattern pwdPattern = java.util.regex.Pattern.compile(
                    "<graphics[^>]*type=['\"]vnc['\"][^>]*passwd=['\"]([^'\"]*)['\"]"
            );
            java.util.regex.Matcher pwdMatcher = pwdPattern.matcher(xml);
            if (pwdMatcher.find()) {
                password = pwdMatcher.group(1);
            }

            if (port <= 0) {
                throw new RuntimeException("Could not determine VNC port for VM: " + name);
            }

            return VncInfoDTO.builder()
                    .host("localhost")
                    .port(port)
                    .password(password)
                    .websocketUrl("/ws/vnc/" + name)
                    .build();

        } catch (LibvirtException e) {
            throw new RuntimeException("Failed to get VNC info: " + e.getMessage(), e);
        } finally {
            close(conn);
        }
    }

    private VmDTO mapToDTO(Domain domain) throws LibvirtException {
        DomainInfo info = domain.getInfo();
        return VmDTO.builder()
                .id(domain.getID())
                .uuid(domain.getUUIDString())
                .name(domain.getName())
                .state(info.state.toString()) // VIR_DOMAIN_RUNNING 等
                .vcpu(info.nrVirtCpu)
                .memory(info.memory * 1024L) // KB 轉 Bytes
                .maxMemory(info.maxMem * 1024L)
                .build();
    }

    private void close(Connect conn) {
        try {
            if (conn != null && conn.isConnected()) conn.close();
        } catch (LibvirtException e) { /* ignore */ }
    }

    // 建立新 VM
    public VmDTO createVm(CreateVmDTO request) {
        Connect conn = null;
        try {
            conn = connect();

            // 1. 建立虛擬磁碟 (qcow2 格式)
            String diskPath = DISK_BASE_PATH + "/" + request.name() + ".qcow2";
            createDisk(diskPath, request.diskGB());

            // 2. 產生 XML 定義
            String uuid = UUID.randomUUID().toString();
            String xml = generateVmXml(request, uuid, diskPath);

            // 3. 定義 VM (不啟動)
            Domain domain = conn.domainDefineXML(xml);

            return mapToDTO(domain);

        } catch (LibvirtException | IOException e) {
            throw new RuntimeException("Failed to create VM: " + e.getMessage(), e);
        } finally {
            close(conn);
        }
    }

    // 刪除 VM
    public void deleteVm(String name) {
        Connect conn = null;
        try {
            conn = connect();
            Domain domain = conn.domainLookupByName(name);

            // 如果 VM 正在運行，先強制關閉
            if (domain.isActive() == 1) {
                domain.destroy();
            }

            // 取得磁碟路徑
            String diskPath = DISK_BASE_PATH + "/" + name + ".qcow2";

            // 取消定義 (刪除 VM)
            domain.undefine();

            // 刪除磁碟檔案
            Files.deleteIfExists(Path.of(diskPath));

        } catch (LibvirtException | IOException e) {
            throw new RuntimeException("Failed to delete VM: " + e.getMessage(), e);
        } finally {
            close(conn);
        }
    }

    // 使用 qemu-img 建立磁碟
    private void createDisk(String path, long sizeGB) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(
                "qemu-img", "create", "-f", "qcow2", path, sizeGB + "G"
        );
        pb.redirectErrorStream(true); // 合併 stderr 到 stdout
        Process process = pb.start();
        
        // 讀取輸出
        String output;
        try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
            output = reader.lines().collect(java.util.stream.Collectors.joining("\n"));
        }
        
        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("qemu-img failed: " + output);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("qemu-img interrupted", e);
        }
    }

    // 產生 libvirt XML 定義
    private String generateVmXml(CreateVmDTO req, String uuid, String diskPath) {
        StringBuilder xml = new StringBuilder();
        
        // 取得設定值（使用預設值）
        String cpuMode = req.cpuMode() != null ? req.cpuMode() : "host-passthrough";
        String diskFormat = req.diskFormat() != null ? req.diskFormat() : "qcow2";
        String diskBus = req.diskBus() != null ? req.diskBus() : "virtio";
        String diskCache = req.diskCache() != null ? req.diskCache() : "none";
        String diskIo = req.diskIo() != null ? req.diskIo() : "native";
        String networkType = req.networkType() != null ? req.networkType() : "network";
        String networkSource = req.networkSource() != null ? req.networkSource() : "default";
        String networkModel = req.networkModel() != null ? req.networkModel() : "virtio";
        String graphicsType = req.graphicsType() != null ? req.graphicsType() : "vnc";
        int graphicsPort = req.graphicsPort() != null ? req.graphicsPort() : -1;
        String graphicsListen = req.graphicsListen() != null ? req.graphicsListen() : "0.0.0.0";
        String videoModel = req.videoModel() != null ? req.videoModel() : "qxl";
        int videoVram = req.videoVram() != null ? req.videoVram() : 65536;
        String machine = req.machine() != null ? req.machine() : ("windows".equalsIgnoreCase(req.osType()) ? "pc-q35" : "pc-i440fx");
        String arch = req.arch() != null ? req.arch() : "x86_64";
        String onPoweroff = req.onPoweroff() != null ? req.onPoweroff() : "destroy";
        String onReboot = req.onReboot() != null ? req.onReboot() : "restart";
        String onCrash = req.onCrash() != null ? req.onCrash() : "destroy";
        String clockOffset = req.clockOffset() != null ? req.clockOffset() : ("windows".equalsIgnoreCase(req.osType()) ? "localtime" : "utc");
        boolean acpi = req.acpi() != null ? req.acpi() : true;
        boolean apic = req.apic() != null ? req.apic() : true;
        boolean usb = req.usb() != null ? req.usb() : true;
        boolean tablet = req.tablet() != null ? req.tablet() : true;
        boolean serial = req.serial() != null ? req.serial() : true;
        long maxMemory = req.maxMemoryMB() != null ? req.maxMemoryMB() : req.memoryMB();

        // 開始建構 XML
        xml.append("<domain type='kvm'>\n");
        xml.append("  <name>").append(escapeXml(req.name())).append("</name>\n");
        xml.append("  <uuid>").append(uuid).append("</uuid>\n");
        
        // 描述
        if (req.description() != null && !req.description().isBlank()) {
            xml.append("  <description>").append(escapeXml(req.description())).append("</description>\n");
        }

        // 記憶體
        xml.append("  <memory unit='MiB'>").append(maxMemory).append("</memory>\n");
        xml.append("  <currentMemory unit='MiB'>").append(req.memoryMB()).append("</currentMemory>\n");

        // vCPU
        xml.append("  <vcpu");
        if (req.cpuSockets() != null || req.cpuCores() != null || req.cpuThreads() != null) {
            xml.append(" placement='static'");
        }
        xml.append(">").append(req.vcpu()).append("</vcpu>\n");

        // CPU 拓撲
        if (req.cpuSockets() != null || req.cpuCores() != null || req.cpuThreads() != null) {
            xml.append("  <cpu mode='").append(cpuMode).append("'>\n");
            xml.append("    <topology");
            xml.append(" sockets='").append(req.cpuSockets() != null ? req.cpuSockets() : 1).append("'");
            xml.append(" cores='").append(req.cpuCores() != null ? req.cpuCores() : req.vcpu()).append("'");
            xml.append(" threads='").append(req.cpuThreads() != null ? req.cpuThreads() : 1).append("'");
            xml.append("/>\n");
            xml.append("  </cpu>\n");
        } else {
            xml.append("  <cpu mode='").append(cpuMode).append("'/>\n");
        }

        // 大分頁
        if (Boolean.TRUE.equals(req.hugepages())) {
            xml.append("  <memoryBacking>\n");
            xml.append("    <hugepages/>\n");
            xml.append("  </memoryBacking>\n");
        }

        // OS 設定
        xml.append("  <os>\n");
        if (Boolean.TRUE.equals(req.uefi())) {
            xml.append("    <type arch='").append(arch).append("' machine='").append(machine).append("'>hvm</type>\n");
            xml.append("    <loader readonly='yes' secure='").append(Boolean.TRUE.equals(req.secureBoot()) ? "yes" : "no")
               .append("' type='pflash'>/usr/share/OVMF/OVMF_CODE.fd</loader>\n");
            xml.append("    <nvram>/var/lib/libvirt/qemu/nvram/").append(escapeXml(req.name())).append("_VARS.fd</nvram>\n");
        } else {
            xml.append("    <type arch='").append(arch).append("' machine='").append(machine).append("'>hvm</type>\n");
        }
        
        // 開機順序
        if (req.bootOrder() != null && !req.bootOrder().isEmpty()) {
            for (String boot : req.bootOrder()) {
                xml.append("    <boot dev='").append(boot).append("'/>\n");
            }
        } else {
            xml.append("    <boot dev='cdrom'/>\n");
            xml.append("    <boot dev='hd'/>\n");
        }
        
        // 開機選單
        if (Boolean.TRUE.equals(req.bootMenu())) {
            xml.append("    <bootmenu enable='yes'/>\n");
        }
        xml.append("  </os>\n");

        // Features
        xml.append("  <features>\n");
        if (acpi) xml.append("    <acpi/>\n");
        if (apic) xml.append("    <apic/>\n");
        xml.append("  </features>\n");

        // 時鐘
        xml.append("  <clock offset='").append(clockOffset).append("'/>\n");

        // 電源管理
        xml.append("  <on_poweroff>").append(onPoweroff).append("</on_poweroff>\n");
        xml.append("  <on_reboot>").append(onReboot).append("</on_reboot>\n");
        xml.append("  <on_crash>").append(onCrash).append("</on_crash>\n");

        // 裝置
        xml.append("  <devices>\n");
        xml.append("    <emulator>/usr/bin/qemu-system-x86_64</emulator>\n");

        // 磁碟
        xml.append("    <disk type='file' device='disk'>\n");
        xml.append("      <driver name='qemu' type='").append(diskFormat).append("'");
        if (diskCache != null) xml.append(" cache='").append(diskCache).append("'");
        if (diskIo != null) xml.append(" io='").append(diskIo).append("'");
        xml.append("/>\n");
        xml.append("      <source file='").append(diskPath).append("'/>\n");
        String diskDev = "virtio".equals(diskBus) ? "vda" : "sda";
        xml.append("      <target dev='").append(diskDev).append("' bus='").append(diskBus).append("'/>\n");
        xml.append("    </disk>\n");

        // CD-ROM
        if (req.isoPath() != null && !req.isoPath().isBlank()) {
            xml.append("    <disk type='file' device='cdrom'>\n");
            xml.append("      <driver name='qemu' type='raw'/>\n");
            xml.append("      <source file='").append(req.isoPath()).append("'/>\n");
            xml.append("      <target dev='sdb' bus='sata'/>\n");
            xml.append("      <readonly/>\n");
            xml.append("    </disk>\n");
        }

        // 網路
        xml.append("    <interface type='").append(networkType).append("'>\n");
        if (req.macAddress() != null && !req.macAddress().isBlank()) {
            xml.append("      <mac address='").append(req.macAddress()).append("'/>\n");
        }
        if ("network".equals(networkType)) {
            xml.append("      <source network='").append(networkSource).append("'/>\n");
        } else if ("bridge".equals(networkType)) {
            xml.append("      <source bridge='").append(networkSource).append("'/>\n");
        }
        xml.append("      <model type='").append(networkModel).append("'/>\n");
        xml.append("    </interface>\n");

        // USB 控制器
        if (usb) {
            xml.append("    <controller type='usb' model='qemu-xhci'/>\n");
            // USB 平板裝置（改善滑鼠定位）
            if (tablet) {
                xml.append("    <input type='tablet' bus='usb'/>\n");
            }
        }

        // 輸入裝置
        xml.append("    <input type='mouse' bus='ps2'/>\n");
        xml.append("    <input type='keyboard' bus='ps2'/>\n");

        // 顯示
        xml.append("    <graphics type='").append(graphicsType).append("'");
        xml.append(" port='").append(graphicsPort).append("'");
        if (graphicsPort == -1) xml.append(" autoport='yes'");
        xml.append(" listen='").append(graphicsListen).append("'");
        if (req.graphicsPassword() != null && !req.graphicsPassword().isBlank()) {
            xml.append(" passwd='").append(escapeXml(req.graphicsPassword())).append("'");
        }
        xml.append(">\n");
        xml.append("      <listen type='address' address='").append(graphicsListen).append("'/>\n");
        xml.append("    </graphics>\n");

        // 顯示卡
        xml.append("    <video>\n");
        xml.append("      <model type='").append(videoModel).append("'");
        if ("qxl".equals(videoModel)) {
            xml.append(" ram='").append(videoVram).append("' vram='").append(videoVram).append("' vgamem='16384' heads='1'");
        } else if ("virtio".equals(videoModel)) {
            xml.append(" heads='1' primary='yes'");
        }
        xml.append("/>\n");
        xml.append("    </video>\n");

        // 串列埠
        if (serial) {
            xml.append("    <serial type='pty'>\n");
            xml.append("      <target port='0'/>\n");
            xml.append("    </serial>\n");
            xml.append("    <console type='pty'>\n");
            xml.append("      <target type='serial' port='0'/>\n");
            xml.append("    </console>\n");
        }

        // TPM
        if (Boolean.TRUE.equals(req.tpm())) {
            xml.append("    <tpm model='tpm-crb'>\n");
            xml.append("      <backend type='emulator' version='2.0'/>\n");
            xml.append("    </tpm>\n");
        }

        // 記憶體氣球
        xml.append("    <memballoon model='virtio'/>\n");

        xml.append("  </devices>\n");
        xml.append("</domain>");

        return xml.toString();
    }

    // XML 字元跳脫
    private String escapeXml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    // ==================== ISO 檔案管理 ====================
    
    public List<IsoFileDTO> listIsoFiles() {
        List<IsoFileDTO> isoFiles = new ArrayList<>();
        try {
            Path imagesDir = Path.of(DISK_BASE_PATH);
            if (Files.exists(imagesDir)) {
                Files.list(imagesDir)
                        .filter(path -> path.toString().toLowerCase().endsWith(".iso"))
                        .forEach(path -> {
                            try {
                                isoFiles.add(IsoFileDTO.builder()
                                        .name(path.getFileName().toString())
                                        .path(path.toAbsolutePath().toString())
                                        .size(Files.size(path))
                                        .build());
                            } catch (IOException e) {
                                // 忽略無法讀取的檔案
                            }
                        });
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to list ISO files: " + e.getMessage(), e);
        }
        return isoFiles;
    }

    public IsoFileDTO uploadIso(org.springframework.web.multipart.MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".iso")) {
            throw new IllegalArgumentException("Only ISO files are allowed");
        }

        // 清理檔案名稱
        String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path targetPath = Path.of(DISK_BASE_PATH, safeFilename);

        try {
            Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            return IsoFileDTO.builder()
                    .name(safeFilename)
                    .path(targetPath.toAbsolutePath().toString())
                    .size(Files.size(targetPath))
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload ISO: " + e.getMessage(), e);
        }
    }

    public void deleteIso(String filename) {
        // 安全檢查：防止路徑穿越攻擊
        if (filename.contains("/") || filename.contains("\\") || filename.contains("..")) {
            throw new IllegalArgumentException("Invalid filename");
        }

        Path isoPath = Path.of(DISK_BASE_PATH, filename);
        try {
            if (!Files.exists(isoPath)) {
                throw new IllegalArgumentException("ISO file not found: " + filename);
            }
            Files.delete(isoPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete ISO: " + e.getMessage(), e);
        }
    }
}
