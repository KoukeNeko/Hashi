package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.CreateVmDTO;
import dev.koukeneko.hashi.model.dto.DiskDTO;
import dev.koukeneko.hashi.model.dto.IsoFileDTO;
import dev.koukeneko.hashi.model.dto.UpdateVmDTO;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    // 取得 VM 詳細資訊 (包含所有設定)
    public VmDTO getVmDetails(String name) {
        Connect conn = null;
        try {
            conn = connect();
            Domain domain = conn.domainLookupByName(name);
            DomainInfo info = domain.getInfo();
            String xml = domain.getXMLDesc(0);
            
            VmDTO.VmDTOBuilder builder = VmDTO.builder()
                    .id(domain.getID())
                    .uuid(domain.getUUIDString())
                    .name(domain.getName())
                    .state(info.state.toString())
                    .vcpu(info.nrVirtCpu)
                    .memory(info.memory * 1024L)
                    .maxMemory(info.maxMem * 1024L)
                    .autostart(domain.getAutostart());
            
            // 解析 XML 取得詳細設定
            parseVmXmlToBuilder(xml, builder);
            
            return builder.build();
        } catch (LibvirtException e) {
            throw new RuntimeException("Failed to get VM details: " + e.getMessage(), e);
        } finally {
            close(conn);
        }
    }

    // 解析 VM XML 設定到 DTO Builder
    private void parseVmXmlToBuilder(String xml, VmDTO.VmDTOBuilder builder) {
        // Description
        builder.description(extractXmlValue(xml, "<description>([^<]*)</description>"));
        
        // CPU Mode
        String cpuMode = extractXmlAttribute(xml, "<cpu[^>]*mode=['\"]([^'\"]+)['\"]");
        builder.cpuMode(cpuMode);
        
        // CPU Topology
        builder.cpuSockets(extractXmlAttributeInt(xml, "sockets=['\"]([^'\"]+)['\"]"));
        builder.cpuCores(extractXmlAttributeInt(xml, "cores=['\"]([^'\"]+)['\"]"));
        builder.cpuThreads(extractXmlAttributeInt(xml, "threads=['\"]([^'\"]+)['\"]"));
        
        // Hugepages
        builder.hugepages(xml.contains("<hugepages/>"));
        
        // 解析所有磁碟
        List<DiskDTO> disks = new ArrayList<>();
        Pattern diskPattern = Pattern.compile("<disk[^>]*device=['\"]disk['\"][^>]*>.*?</disk>", Pattern.DOTALL);
        Matcher diskMatcher = diskPattern.matcher(xml);
        boolean isFirstDisk = true;
        while (diskMatcher.find()) {
            String diskXml = diskMatcher.group();
            String diskPath = extractXmlAttribute(diskXml, "<source file=['\"]([^'\"]+)['\"]");
            String diskFormat = extractXmlAttribute(diskXml, "type=['\"]([^'\"]+)['\"]");
            String diskBus = extractXmlAttribute(diskXml, "bus=['\"]([^'\"]+)['\"]");
            String targetDev = extractXmlAttribute(diskXml, "<target dev=['\"]([^'\"]+)['\"]");
            
            Long diskSize = null;
            if (diskPath != null) {
                try {
                    diskSize = Files.size(Path.of(diskPath));
                } catch (Exception e) { /* ignore */ }
            }
            
            // 第一個磁碟設為主磁碟（向後相容）
            if (isFirstDisk) {
                builder.diskPath(diskPath);
                builder.diskFormat(diskFormat);
                builder.diskBus(diskBus);
                builder.diskSizeBytes(diskSize);
                isFirstDisk = false;
            }
            
            // 添加到磁碟列表
            disks.add(DiskDTO.builder()
                    .name(targetDev)
                    .path(diskPath)
                    .format(diskFormat)
                    .bus(diskBus)
                    .sizeGB(diskSize != null ? diskSize / (1024L * 1024L * 1024L) : null)
                    .build());
        }
        builder.disks(disks.isEmpty() ? null : disks);
        
        // CD-ROM / ISO
        Pattern cdromPattern = Pattern.compile("<disk[^>]*device=['\"]cdrom['\"][^>]*>.*?</disk>", Pattern.DOTALL);
        Matcher cdromMatcher = cdromPattern.matcher(xml);
        if (cdromMatcher.find()) {
            String cdromXml = cdromMatcher.group();
            builder.isoPath(extractXmlAttribute(cdromXml, "<source file=['\"]([^'\"]+)['\"]"));
        }
        
        // Network
        Pattern netPattern = Pattern.compile("<interface[^>]*>.*?</interface>", Pattern.DOTALL);
        Matcher netMatcher = netPattern.matcher(xml);
        if (netMatcher.find()) {
            String netXml = netMatcher.group();
            builder.networkType(extractXmlAttribute(netXml, "<interface type=['\"]([^'\"]+)['\"]"));
            builder.macAddress(extractXmlAttribute(netXml, "<mac address=['\"]([^'\"]+)['\"]"));
            builder.networkSource(extractXmlAttribute(netXml, "<source (?:network|bridge)=['\"]([^'\"]+)['\"]"));
            builder.networkModel(extractXmlAttribute(netXml, "<model type=['\"]([^'\"]+)['\"]"));
        }
        
        // Graphics
        Pattern graphicsPattern = Pattern.compile("<graphics[^>]*>.*?</graphics>", Pattern.DOTALL);
        Matcher graphicsMatcher = graphicsPattern.matcher(xml);
        if (graphicsMatcher.find()) {
            String gfxXml = graphicsMatcher.group();
            builder.graphicsType(extractXmlAttribute(gfxXml, "<graphics type=['\"]([^'\"]+)['\"]"));
            builder.graphicsPort(extractXmlAttributeInt(gfxXml, "port=['\"](-?\\d+)['\"]"));
            builder.graphicsListen(extractXmlAttribute(gfxXml, "listen=['\"]([^'\"]+)['\"]"));
        }
        
        // Video
        Pattern videoPattern = Pattern.compile("<video>.*?</video>", Pattern.DOTALL);
        Matcher videoMatcher = videoPattern.matcher(xml);
        if (videoMatcher.find()) {
            String vidXml = videoMatcher.group();
            builder.videoModel(extractXmlAttribute(vidXml, "<model type=['\"]([^'\"]+)['\"]"));
            builder.videoVram(extractXmlAttributeInt(vidXml, "vram=['\"]([^'\"]+)['\"]"));
        }
        
        // Boot Order
        List<String> bootOrder = new ArrayList<>();
        Pattern bootPattern = Pattern.compile("<boot dev=['\"]([^'\"]+)['\"]");
        Matcher bootMatcher = bootPattern.matcher(xml);
        while (bootMatcher.find()) {
            bootOrder.add(bootMatcher.group(1));
        }
        builder.bootOrder(bootOrder.isEmpty() ? null : bootOrder);
        
        // Boot Menu
        builder.bootMenu(xml.contains("<bootmenu enable='yes'") || xml.contains("<bootmenu enable=\"yes\""));
        
        // UEFI
        builder.uefi(xml.contains("<loader") && xml.contains("OVMF"));
        
        // OS Type
        if (xml.contains("localtime")) {
            builder.osType("windows");
        } else {
            builder.osType("linux");
        }
        
        // Machine
        builder.machine(extractXmlAttribute(xml, "machine=['\"]([^'\"]+)['\"]"));
        
        // Power Management
        builder.onPoweroff(extractXmlValue(xml, "<on_poweroff>([^<]+)</on_poweroff>"));
        builder.onReboot(extractXmlValue(xml, "<on_reboot>([^<]+)</on_reboot>"));
        builder.onCrash(extractXmlValue(xml, "<on_crash>([^<]+)</on_crash>"));
        
        // Features
        builder.acpi(xml.contains("<acpi/>") || xml.contains("<acpi>"));
        builder.apic(xml.contains("<apic/>") || xml.contains("<apic>"));
        
        // Clock
        builder.clockOffset(extractXmlAttribute(xml, "<clock offset=['\"]([^'\"]+)['\"]"));
        
        // Devices
        builder.usb(xml.contains("<controller type='usb'") || xml.contains("<controller type=\"usb\""));
        builder.tablet(xml.contains("<input type='tablet'") || xml.contains("<input type=\"tablet\""));
        builder.serial(xml.contains("<serial type='pty'") || xml.contains("<serial type=\"pty\""));
        builder.tpm(xml.contains("<tpm"));
    }
    
    private String extractXmlValue(String xml, String regex) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(xml);
        return matcher.find() ? matcher.group(1) : null;
    }
    
    private String extractXmlAttribute(String xml, String regex) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(xml);
        return matcher.find() ? matcher.group(1) : null;
    }
    
    private Integer extractXmlAttributeInt(String xml, String regex) {
        String value = extractXmlAttribute(xml, regex);
        if (value != null) {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) { /* ignore */ }
        }
        return null;
    }

    // 更新 VM 設定
    public VmDTO updateVm(String name, UpdateVmDTO request) {
        Connect conn = null;
        try {
            conn = connect();
            Domain domain = conn.domainLookupByName(name);
            boolean isRunning = domain.isActive() == 1;
            
            // 取得現有 XML
            String xml = domain.getXMLDesc(0);
            
            // 修改 XML
            xml = applyUpdatesToXml(xml, request, isRunning);
            
            // 重新定義 VM (無論運行狀態都可以更新定義)
            // 注意：運行中的 VM 某些設定需要重啟才能生效
            domain = conn.domainDefineXML(xml);
            
            // 處理 autostart
            if (request.autostart() != null) {
                domain.setAutostart(request.autostart());
            }
            
            return getVmDetails(name);
        } catch (LibvirtException e) {
            throw new RuntimeException("Failed to update VM: " + e.getMessage(), e);
        } finally {
            close(conn);
        }
    }
    
    // 將更新套用到 XML
    private String applyUpdatesToXml(String xml, UpdateVmDTO req, boolean isRunning) {
        // Description
        if (req.description() != null) {
            if (xml.contains("<description>")) {
                xml = xml.replaceFirst("<description>[^<]*</description>", 
                        "<description>" + escapeXml(req.description()) + "</description>");
            } else {
                xml = xml.replaceFirst("</name>", "</name>\n  <description>" + escapeXml(req.description()) + "</description>");
            }
        }
        
        // Memory (可部分熱更新) - 支援 KiB 和 MiB 兩種單位
        if (req.memoryMB() != null) {
            // 嘗試符合 KiB 單位
            if (xml.contains("<currentMemory unit='KiB'") || xml.contains("<currentMemory unit=\"KiB\"")) {
                xml = xml.replaceFirst("<currentMemory unit=['\"]KiB['\"]>\\d+</currentMemory>", 
                        "<currentMemory unit='KiB'>" + (req.memoryMB() * 1024) + "</currentMemory>");
            } else {
                // 符合 MiB 單位
                xml = xml.replaceFirst("<currentMemory unit=['\"]MiB['\"]>\\d+</currentMemory>", 
                        "<currentMemory unit='MiB'>" + req.memoryMB() + "</currentMemory>");
            }
        }
        if (req.maxMemoryMB() != null) {
            // 嘗試符合 KiB 單位
            if (xml.contains("<memory unit='KiB'") || xml.contains("<memory unit=\"KiB\"")) {
                xml = xml.replaceFirst("<memory unit=['\"]KiB['\"]>\\d+</memory>", 
                        "<memory unit='KiB'>" + (req.maxMemoryMB() * 1024) + "</memory>");
            } else {
                // 符合 MiB 單位
                xml = xml.replaceFirst("<memory unit=['\"]MiB['\"]>\\d+</memory>", 
                        "<memory unit='MiB'>" + req.maxMemoryMB() + "</memory>");
            }
        }
        
        // vCPU (需關機)
        if (req.vcpu() != null && !isRunning) {
            xml = xml.replaceFirst("<vcpu[^>]*>\\d+</vcpu>", "<vcpu>" + req.vcpu() + "</vcpu>");
        }
        
        // CPU Mode (需關機)
        if (req.cpuMode() != null && !isRunning) {
            if (xml.contains("<cpu mode=")) {
                xml = xml.replaceFirst("<cpu mode=['\"][^'\"]*['\"]", "<cpu mode='" + req.cpuMode() + "'");
            }
        }
        
        // Graphics Password (可熱更新)
        if (req.graphicsPassword() != null) {
            // 先移除現有密碼
            xml = xml.replaceFirst(" passwd=['\"][^'\"]*['\"]", "");
            // 加入新密碼
            if (!req.graphicsPassword().isEmpty()) {
                xml = xml.replaceFirst("<graphics type=['\"]([^'\"]+)['\"]", 
                        "<graphics type='$1' passwd='" + escapeXml(req.graphicsPassword()) + "'");
            }
        }
        
        // Graphics Listen
        if (req.graphicsListen() != null) {
            xml = xml.replaceFirst("listen=['\"][^'\"]*['\"]", "listen='" + req.graphicsListen() + "'");
            xml = xml.replaceFirst("<listen type=['\"]address['\"] address=['\"][^'\"]*['\"]/>", 
                    "<listen type='address' address='" + req.graphicsListen() + "'/>");
        }
        
        // Boot Order (需關機)
        if (req.bootOrder() != null && !isRunning) {
            // 移除現有 boot 設定
            xml = xml.replaceAll("\\s*<boot dev=['\"][^'\"]*['\"]/>", "");
            // 在 </os> 前加入新的 boot 順序
            StringBuilder bootXml = new StringBuilder();
            for (String boot : req.bootOrder()) {
                bootXml.append("    <boot dev='").append(boot).append("'/>\n");
            }
            xml = xml.replaceFirst("(\\s*)</os>", "\n" + bootXml + "  </os>");
        }
        
        // Boot Menu (需關機)
        if (req.bootMenu() != null && !isRunning) {
            xml = xml.replaceFirst("<bootmenu enable=['\"][^'\"]*['\"]/>", "");
            if (req.bootMenu()) {
                xml = xml.replaceFirst("</os>", "    <bootmenu enable='yes'/>\n  </os>");
            }
        }
        
        // Power Management
        if (req.onPoweroff() != null) {
            xml = xml.replaceFirst("<on_poweroff>[^<]+</on_poweroff>", 
                    "<on_poweroff>" + req.onPoweroff() + "</on_poweroff>");
        }
        if (req.onReboot() != null) {
            xml = xml.replaceFirst("<on_reboot>[^<]+</on_reboot>", 
                    "<on_reboot>" + req.onReboot() + "</on_reboot>");
        }
        if (req.onCrash() != null) {
            xml = xml.replaceFirst("<on_crash>[^<]+</on_crash>", 
                    "<on_crash>" + req.onCrash() + "</on_crash>");
        }
        
        // Clock Offset (需關機)
        if (req.clockOffset() != null && !isRunning) {
            xml = xml.replaceFirst("<clock offset=['\"][^'\"]*['\"]", "<clock offset='" + req.clockOffset() + "'");
        }
        
        // CD-ROM / ISO (可熱插拔)
        if (req.isoPath() != null) {
            if (req.isoPath().isEmpty()) {
                // 彈出 ISO - 移除 source
                xml = xml.replaceFirst(
                        "(<disk[^>]*device=['\"]cdrom['\"][^>]*>.*?)<source file=['\"][^'\"]*['\"]/>",
                        "$1");
            } else {
                // 換 ISO
                Pattern cdromPattern = Pattern.compile(
                        "(<disk[^>]*device=['\"]cdrom['\"][^>]*>)(.*?)(</disk>)", Pattern.DOTALL);
                Matcher cdromMatcher = cdromPattern.matcher(xml);
                if (cdromMatcher.find()) {
                    String cdromContent = cdromMatcher.group(2);
                    if (cdromContent.contains("<source file=")) {
                        cdromContent = cdromContent.replaceFirst("<source file=['\"][^'\"]*['\"]/>", 
                                "<source file='" + req.isoPath() + "'/>");
                    } else {
                            cdromContent = cdromContent.replaceFirst("<driver", 
                                    "<source file='" + req.isoPath() + "'/>\n      <driver");
                        }
                        xml = cdromMatcher.replaceFirst("$1" + Matcher.quoteReplacement(cdromContent) + "$3");
                    }
                }
            }

        
        return xml;
    }

    private void close(Connect conn) {
        try {
            if (conn != null && conn.isConnected()) conn.close();
        } catch (LibvirtException e) { /* ignore */ }
    }

    // 建立新 VM
    public VmDTO createVm(CreateVmDTO request) {
        Connect conn = null;
        List<String> createdDiskPaths = new ArrayList<>();
        try {
            conn = connect();

            // 1. 建立主磁碟 (向後相容)
            String primaryDiskPath = null;
            if (request.diskGB() != null && request.diskGB() > 0) {
                primaryDiskPath = DISK_BASE_PATH + "/" + request.name() + ".qcow2";
                String format = request.diskFormat() != null ? request.diskFormat() : "qcow2";
                createDisk(primaryDiskPath, request.diskGB(), format);
                createdDiskPaths.add(primaryDiskPath);
            }

            // 2. 建立額外磁碟
            List<DiskDTO> additionalDisks = new ArrayList<>();
            if (request.disks() != null && !request.disks().isEmpty()) {
                for (int i = 0; i < request.disks().size(); i++) {
                    DiskDTO disk = request.disks().get(i);
                    String diskPath;
                    
                    if (disk.path() != null && !disk.path().isBlank()) {
                        // 使用現有磁碟
                        diskPath = disk.path();
                    } else if (disk.sizeGB() != null && disk.sizeGB() > 0) {
                        // 建立新磁碟
                        String diskName = disk.name() != null ? disk.name() : "disk" + (i + 1);
                        String format = disk.format() != null ? disk.format() : "qcow2";
                        diskPath = DISK_BASE_PATH + "/" + request.name() + "-" + diskName + "." + format;
                        createDisk(diskPath, disk.sizeGB(), format);
                        createdDiskPaths.add(diskPath);
                    } else {
                        continue; // 跳過無效磁碟定義
                    }
                    
                    additionalDisks.add(DiskDTO.builder()
                            .name(disk.name())
                            .path(diskPath)
                            .format(disk.format() != null ? disk.format() : "qcow2")
                            .bus(disk.bus() != null ? disk.bus() : "virtio")
                            .cache(disk.cache())
                            .io(disk.io())
                            .bootable(disk.bootable())
                            .build());
                }
            }

            // 3. 產生 XML 定義
            String uuid = UUID.randomUUID().toString();
            String xml = generateVmXml(request, uuid, primaryDiskPath, additionalDisks);

            // 4. 定義 VM (不啟動)
            Domain domain = conn.domainDefineXML(xml);

            return mapToDTO(domain);

        } catch (LibvirtException | IOException e) {
            // 清理已建立的磁碟
            for (String diskPath : createdDiskPaths) {
                try {
                    Files.deleteIfExists(Path.of(diskPath));
                } catch (IOException ignored) {}
            }
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

            // 從 XML 解析所有磁碟路徑
            String xml = domain.getXMLDesc(0);
            List<String> diskPaths = new ArrayList<>();
            Pattern diskPattern = Pattern.compile("<disk[^>]*device=['\"]disk['\"][^>]*>.*?<source file=['\"]([^'\"]+)['\"].*?</disk>", Pattern.DOTALL);
            Matcher diskMatcher = diskPattern.matcher(xml);
            while (diskMatcher.find()) {
                diskPaths.add(diskMatcher.group(1));
            }

            // 取消定義 (刪除 VM)
            domain.undefine();

            // 刪除所有磁碟檔案
            for (String diskPath : diskPaths) {
                try {
                    Files.deleteIfExists(Path.of(diskPath));
                } catch (IOException e) {
                    // 記錄但不中斷
                    System.err.println("Failed to delete disk: " + diskPath + " - " + e.getMessage());
                }
            }

        } catch (LibvirtException e) {
            throw new RuntimeException("Failed to delete VM: " + e.getMessage(), e);
        } finally {
            close(conn);
        }
    }

    // 使用 qemu-img 建立磁碟
    private void createDisk(String path, long sizeGB, String format) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(
                "qemu-img", "create", "-f", format, path, sizeGB + "G"
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
    private String generateVmXml(CreateVmDTO req, String uuid, String primaryDiskPath, List<DiskDTO> additionalDisks) {
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
        String machine = req.machine() != null ? req.machine() : ("windows".equalsIgnoreCase(req.osType()) ? "q35" : "pc");
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

        // PCI 控制器 - Q35 需要明確定義
        if (machine.contains("q35")) {
            xml.append("    <controller type='pci' index='0' model='pcie-root'/>\n");
            xml.append("    <controller type='pci' index='1' model='pcie-root-port'>\n");
            xml.append("      <model name='pcie-root-port'/>\n");
            xml.append("      <target chassis='1' port='0x10'/>\n");
            xml.append("      <address type='pci' domain='0x0000' bus='0x00' slot='0x02' function='0x0'/>\n");
            xml.append("    </controller>\n");
            xml.append("    <controller type='pci' index='2' model='pcie-root-port'>\n");
            xml.append("      <model name='pcie-root-port'/>\n");
            xml.append("      <target chassis='2' port='0x11'/>\n");
            xml.append("      <address type='pci' domain='0x0000' bus='0x00' slot='0x02' function='0x1'/>\n");
            xml.append("    </controller>\n");
            xml.append("    <controller type='pci' index='3' model='pcie-root-port'>\n");
            xml.append("      <model name='pcie-root-port'/>\n");
            xml.append("      <target chassis='3' port='0x12'/>\n");
            xml.append("      <address type='pci' domain='0x0000' bus='0x00' slot='0x02' function='0x2'/>\n");
            xml.append("    </controller>\n");
            xml.append("    <controller type='pci' index='4' model='pcie-root-port'>\n");
            xml.append("      <model name='pcie-root-port'/>\n");
            xml.append("      <target chassis='4' port='0x13'/>\n");
            xml.append("      <address type='pci' domain='0x0000' bus='0x00' slot='0x02' function='0x3'/>\n");
            xml.append("    </controller>\n");
            xml.append("    <controller type='pci' index='5' model='pcie-root-port'>\n");
            xml.append("      <model name='pcie-root-port'/>\n");
            xml.append("      <target chassis='5' port='0x14'/>\n");
            xml.append("      <address type='pci' domain='0x0000' bus='0x00' slot='0x02' function='0x4'/>\n");
            xml.append("    </controller>\n");
            xml.append("    <controller type='sata' index='0'>\n");
            xml.append("      <address type='pci' domain='0x0000' bus='0x00' slot='0x1f' function='0x2'/>\n");
            xml.append("    </controller>\n");
        }

        // 磁碟計數器 (用於生成裝置名稱)
        int virtioIdx = 0;  // vda, vdb, vdc...
        int sataIdx = 0;    // sda, sdb, sdc...
        int scsiIdx = 0;    // sda, sdb, sdc... (SCSI)
        int ideIdx = 0;     // hda, hdb, hdc...

        // 主磁碟
        if (primaryDiskPath != null) {
            xml.append("    <disk type='file' device='disk'>\n");
            xml.append("      <driver name='qemu' type='").append(diskFormat).append("'");
            if (diskCache != null) xml.append(" cache='").append(diskCache).append("'");
            if (diskIo != null) xml.append(" io='").append(diskIo).append("'");
            xml.append("/>\n");
            xml.append("      <source file='").append(primaryDiskPath).append("'/>\n");
            String diskDev = getDiskDeviceName(diskBus, virtioIdx, sataIdx, scsiIdx, ideIdx);
            xml.append("      <target dev='").append(diskDev).append("' bus='").append(diskBus).append("'/>\n");
            xml.append("    </disk>\n");
            
            // 更新計數器
            switch (diskBus) {
                case "virtio" -> virtioIdx++;
                case "sata" -> sataIdx++;
                case "scsi" -> scsiIdx++;
                case "ide" -> ideIdx++;
            }
        }

        // 額外磁碟
        if (additionalDisks != null) {
            for (DiskDTO disk : additionalDisks) {
                String bus = disk.bus() != null ? disk.bus() : "virtio";
                String format = disk.format() != null ? disk.format() : "qcow2";
                
                xml.append("    <disk type='file' device='disk'>\n");
                xml.append("      <driver name='qemu' type='").append(format).append("'");
                if (disk.cache() != null) xml.append(" cache='").append(disk.cache()).append("'");
                if (disk.io() != null) xml.append(" io='").append(disk.io()).append("'");
                xml.append("/>\n");
                xml.append("      <source file='").append(disk.path()).append("'/>\n");
                String diskDev = getDiskDeviceName(bus, virtioIdx, sataIdx, scsiIdx, ideIdx);
                xml.append("      <target dev='").append(diskDev).append("' bus='").append(bus).append("'/>\n");
                xml.append("    </disk>\n");
                
                // 更新計數器
                switch (bus) {
                    case "virtio" -> virtioIdx++;
                    case "sata" -> sataIdx++;
                    case "scsi" -> scsiIdx++;
                    case "ide" -> ideIdx++;
                }
            }
        }

        // CD-ROM (使用 SATA 匯流排)
        if (req.isoPath() != null && !req.isoPath().isBlank()) {
            xml.append("    <disk type='file' device='cdrom'>\n");
            xml.append("      <driver name='qemu' type='raw'/>\n");
            xml.append("      <source file='").append(req.isoPath()).append("'/>\n");
            String cdromDev = getDiskDeviceName("sata", 0, sataIdx, 0, 0);
            xml.append("      <target dev='").append(cdromDev).append("' bus='sata'/>\n");
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

    // 根據匯流排類型和索引生成磁碟裝置名稱
    private String getDiskDeviceName(String bus, int virtioIdx, int sataIdx, int scsiIdx, int ideIdx) {
        return switch (bus) {
            case "virtio" -> "vd" + (char)('a' + virtioIdx);
            case "sata" -> "sd" + (char)('a' + sataIdx);
            case "scsi" -> "sd" + (char)('a' + scsiIdx);
            case "ide" -> "hd" + (char)('a' + ideIdx);
            default -> "vd" + (char)('a' + virtioIdx);
        };
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
