package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.NetworkInterfaceDTO;
import java.util.List;

public interface NetworkService {
    List<NetworkInterfaceDTO> listInterfaces();

    List<String> getDnsConfig();

    void updateDnsConfig(List<String> nameservers);
}
