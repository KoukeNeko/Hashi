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
}
