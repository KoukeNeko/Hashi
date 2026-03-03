package dev.koukeneko.hashi.service.k8s;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class K8sConfigService {

    public static final String ENV_KUBECONFIG = "HASHI_KUBECONFIG";

    private final ObjectMapper objectMapper;

    public record StoredConfig(String kubeconfigPath, String updatedAt) {
    }

    public record ResolvedConfig(String effectivePath, String source, String overridePath) {
    }

    public Path getOverrideConfigFile() {
        return Paths.get(System.getProperty("user.home"), ".config", "hashi", "k8s-config.json");
    }

    public Optional<String> getOverridePath() {
        Path file = getOverrideConfigFile();
        if (!Files.exists(file)) {
            return Optional.empty();
        }

        try {
            StoredConfig config = objectMapper.readValue(file.toFile(), StoredConfig.class);
            if (config == null || config.kubeconfigPath() == null || config.kubeconfigPath().isBlank()) {
                return Optional.empty();
            }
            return Optional.of(config.kubeconfigPath().trim());
        } catch (IOException e) {
            log.warn("Failed to read k8s override config: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public void saveOverridePath(String kubeconfigPath) {
        if (kubeconfigPath == null || kubeconfigPath.isBlank()) {
            throw new K8sException(400, "kubeconfigPath is required");
        }

        Path normalized = Paths.get(kubeconfigPath).toAbsolutePath().normalize();
        if (!Files.exists(normalized) || !Files.isRegularFile(normalized)) {
            throw new K8sException(400, "kubeconfig file does not exist: " + normalized);
        }

        if (!Files.isReadable(normalized)) {
            throw new K8sException(400, "kubeconfig file is not readable: " + normalized);
        }

        Path file = getOverrideConfigFile();
        try {
            Files.createDirectories(file.getParent());
            StoredConfig config = new StoredConfig(normalized.toString(), OffsetDateTime.now().toString());
            objectMapper.writeValue(file.toFile(), config);
            secureFilePermissions(file);
        } catch (IOException e) {
            throw new K8sException(500, "Failed to save k8s config override", e);
        }
    }

    public void clearOverridePath() {
        Path file = getOverrideConfigFile();
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new K8sException(500, "Failed to clear k8s config override", e);
        }
    }

    public ResolvedConfig resolveConfig() {
        Optional<String> overridePath = getOverridePath();
        if (overridePath.isPresent() && isReadableFile(overridePath.get())) {
            return new ResolvedConfig(overridePath.get(), "override", overridePath.get());
        }

        String envPath = System.getenv(ENV_KUBECONFIG);
        if (envPath != null && !envPath.isBlank() && isReadableFile(envPath)) {
            return new ResolvedConfig(Paths.get(envPath).toAbsolutePath().normalize().toString(), "env", overridePath.orElse(null));
        }

        Path userDefault = Paths.get(System.getProperty("user.home"), ".kube", "config");
        if (Files.exists(userDefault) && Files.isReadable(userDefault) && Files.isRegularFile(userDefault)) {
            return new ResolvedConfig(userDefault.toAbsolutePath().normalize().toString(), "default-user", overridePath.orElse(null));
        }

        Path k3sDefault = Paths.get("/etc/rancher/k3s/k3s.yaml");
        if (Files.exists(k3sDefault) && Files.isReadable(k3sDefault) && Files.isRegularFile(k3sDefault)) {
            return new ResolvedConfig(k3sDefault.toAbsolutePath().normalize().toString(), "default-k3s", overridePath.orElse(null));
        }

        return new ResolvedConfig(null, "none", overridePath.orElse(null));
    }

    public boolean canEdit() {
        return true;
    }

    private boolean isReadableFile(String path) {
        try {
            Path p = Paths.get(path).toAbsolutePath().normalize();
            return Files.exists(p) && Files.isRegularFile(p) && Files.isReadable(p);
        } catch (Exception e) {
            return false;
        }
    }

    private void secureFilePermissions(Path file) {
        try {
            Set<PosixFilePermission> permissions = new HashSet<>(
                    PosixFilePermissions.fromString("rw-------"));
            Files.setPosixFilePermissions(file, permissions);
        } catch (UnsupportedOperationException ignored) {
            // Non-POSIX filesystem (e.g., Windows), ignore permission hardening.
        } catch (IOException e) {
            log.warn("Failed to set permissions on {}: {}", file, e.getMessage());
        }
    }
}
