package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.SystemDiskDTO;
import java.util.List;

public interface DiskService {
    List<SystemDiskDTO> listDisks();

    void mount(String source, String target, String fstype, String options);

    void unmount(String target);

    void format(String device, String fstype, String label);
}
