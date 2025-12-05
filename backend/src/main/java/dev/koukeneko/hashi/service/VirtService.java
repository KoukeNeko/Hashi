package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.CreateVmDTO;
import dev.koukeneko.hashi.model.dto.VmDTO;
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
        String osTypeTag = "linux".equalsIgnoreCase(req.osType()) ? "hvm" : "hvm";
        String machine = "windows".equalsIgnoreCase(req.osType()) ? "q35" : "pc";

        return """
                <domain type='kvm'>
                  <name>%s</name>
                  <uuid>%s</uuid>
                  <memory unit='MiB'>%d</memory>
                  <currentMemory unit='MiB'>%d</currentMemory>
                  <vcpu>%d</vcpu>
                  <os>
                    <type arch='x86_64' machine='%s'>%s</type>
                    <boot dev='cdrom'/>
                    <boot dev='hd'/>
                  </os>
                  <features>
                    <acpi/>
                    <apic/>
                  </features>
                  <cpu mode='host-passthrough'/>
                  <devices>
                    <emulator>/usr/bin/qemu-system-x86_64</emulator>
                    <disk type='file' device='disk'>
                      <driver name='qemu' type='qcow2'/>
                      <source file='%s'/>
                      <target dev='vda' bus='virtio'/>
                    </disk>
                    %s
                    <interface type='network'>
                      <source network='default'/>
                      <model type='virtio'/>
                    </interface>
                    <graphics type='vnc' port='-1' autoport='yes' listen='0.0.0.0'>
                      <listen type='address' address='0.0.0.0'/>
                    </graphics>
                    <video>
                      <model type='qxl' ram='65536' vram='65536' vgamem='16384' heads='1'/>
                    </video>
                    <console type='pty'>
                      <target type='serial' port='0'/>
                    </console>
                  </devices>
                </domain>
                """.formatted(
                req.name(),
                uuid,
                req.memoryMB(),
                req.memoryMB(),
                req.vcpu(),
                machine,
                osTypeTag,
                diskPath,
                req.isoPath() != null && !req.isoPath().isBlank()
                        ? "<disk type='file' device='cdrom'><driver name='qemu' type='raw'/><source file='" + req.isoPath() + "'/><target dev='sda' bus='sata'/><readonly/></disk>"
                        : ""
        );
    }
}
