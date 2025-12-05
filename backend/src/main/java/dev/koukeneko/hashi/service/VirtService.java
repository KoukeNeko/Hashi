package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.VmDTO;
import org.libvirt.Connect;
import org.libvirt.Domain;
import org.libvirt.DomainInfo;
import org.libvirt.LibvirtException;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class VirtService {

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
}
