package dev.koukeneko.hashi.service.k8s;

import dev.koukeneko.hashi.model.dto.K8sApplyItemResultDTO;
import dev.koukeneko.hashi.model.dto.K8sApplyResponseDTO;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.apis.AppsV1Api;
import io.kubernetes.client.openapi.apis.AutoscalingV2Api;
import io.kubernetes.client.openapi.apis.BatchV1Api;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.apis.NetworkingV1Api;
import io.kubernetes.client.openapi.models.V1ConfigMap;
import io.kubernetes.client.openapi.models.V1DaemonSet;
import io.kubernetes.client.openapi.models.V1Deployment;
import io.kubernetes.client.openapi.models.V1Ingress;
import io.kubernetes.client.openapi.models.V1Job;
import io.kubernetes.client.openapi.models.V1CronJob;
import io.kubernetes.client.openapi.models.V1ObjectMeta;
import io.kubernetes.client.openapi.models.V1PersistentVolumeClaim;
import io.kubernetes.client.openapi.models.V1Secret;
import io.kubernetes.client.openapi.models.V1Service;
import io.kubernetes.client.openapi.models.V1StatefulSet;
import io.kubernetes.client.openapi.models.V2HorizontalPodAutoscaler;
import io.kubernetes.client.util.Yaml;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@Slf4j
public class K8sYamlApplyService {

    private static final int MAX_MANIFEST_BYTES = 1024 * 1024;
    private static final int MAX_DOCUMENTS = 50;

    private static final Pattern K8S_NAME_PATTERN = Pattern.compile("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$");

    private static final Set<String> ALLOWED_KINDS = Set.of(
            "deployment",
            "statefulset",
            "daemonset",
            "service",
            "configmap",
            "secret",
            "ingress",
            "job",
            "cronjob",
            "horizontalpodautoscaler",
            "persistentvolumeclaim");

    public K8sApplyResponseDTO applyManifest(
            ApiClient apiClient,
            String manifest,
            String defaultNamespace,
            boolean dryRun) {

        validateManifest(manifest);
        List<String> documents = splitDocuments(manifest);

        if (documents.size() > MAX_DOCUMENTS) {
            throw new K8sException(400, "Too many YAML documents. Maximum is " + MAX_DOCUMENTS);
        }

        List<K8sApplyItemResultDTO> results = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        boolean success = true;

        for (String doc : documents) {
            if (doc.isBlank()) {
                continue;
            }

            try {
                K8sApplyItemResultDTO result = applySingleDocument(apiClient, doc, defaultNamespace, dryRun);
                results.add(result);
                if (!"success".equals(result.status())) {
                    success = false;
                }
            } catch (K8sException e) {
                success = false;
                results.add(K8sApplyItemResultDTO.builder()
                        .kind("unknown")
                        .namespace(defaultNamespace)
                        .name("unknown")
                        .action("validate")
                        .status("error")
                        .message(e.getMessage())
                        .build());
            } catch (Exception e) {
                success = false;
                log.error("Failed to apply YAML document", e);
                results.add(K8sApplyItemResultDTO.builder()
                        .kind("unknown")
                        .namespace(defaultNamespace)
                        .name("unknown")
                        .action("apply")
                        .status("error")
                        .message("Failed to process YAML document: " + e.getMessage())
                        .build());
            }
        }

        if (!warnings.isEmpty()) {
            success = false;
        }

        return K8sApplyResponseDTO.builder()
                .success(success)
                .dryRun(dryRun)
                .results(results)
                .warnings(warnings)
                .build();
    }

    private K8sApplyItemResultDTO applySingleDocument(
            ApiClient apiClient,
            String document,
            String defaultNamespace,
            boolean dryRun) {

        Object loaded;
        try {
            loaded = Yaml.load(document);
        } catch (IOException e) {
            throw new K8sException(400, "Failed to parse YAML document: " + e.getMessage(), e);
        }
        if (!(loaded instanceof Map<?, ?> rawMap)) {
            throw new K8sException(400, "Invalid YAML document. Expected a Kubernetes object.");
        }

        String kind = normalizeKind((String) rawMap.get("kind"));
        if (kind.isBlank()) {
            throw new K8sException(400, "YAML document missing 'kind' field");
        }

        if (!ALLOWED_KINDS.contains(kind)) {
            throw new K8sException(400, "Unsupported kind for apply: " + kind);
        }

        String name = extractMetadataField(rawMap, "name");
        if (name == null || name.isBlank()) {
            throw new K8sException(400, "metadata.name is required");
        }
        validateK8sName(name, "metadata.name");

        String namespace = extractMetadataField(rawMap, "namespace");
        if (namespace == null || namespace.isBlank()) {
            namespace = defaultNamespace;
        }
        if (namespace == null || namespace.isBlank()) {
            throw new K8sException(400, "Namespace is required for namespaced resources");
        }
        validateK8sName(namespace, "metadata.namespace");

        String dryRunArg = dryRun ? "All" : null;

        String action = switch (kind) {
            case "deployment" -> applyDeployment(apiClient, document, namespace, name, dryRunArg);
            case "statefulset" -> applyStatefulSet(apiClient, document, namespace, name, dryRunArg);
            case "daemonset" -> applyDaemonSet(apiClient, document, namespace, name, dryRunArg);
            case "service" -> applyService(apiClient, document, namespace, name, dryRunArg);
            case "configmap" -> applyConfigMap(apiClient, document, namespace, name, dryRunArg);
            case "secret" -> applySecret(apiClient, document, namespace, name, dryRunArg);
            case "ingress" -> applyIngress(apiClient, document, namespace, name, dryRunArg);
            case "job" -> applyJob(apiClient, document, namespace, name, dryRunArg);
            case "cronjob" -> applyCronJob(apiClient, document, namespace, name, dryRunArg);
            case "horizontalpodautoscaler" -> applyHpa(apiClient, document, namespace, name, dryRunArg);
            case "persistentvolumeclaim" -> applyPvc(apiClient, document, namespace, name, dryRunArg);
            default -> throw new K8sException(400, "Unsupported kind for apply: " + kind);
        };

        return K8sApplyItemResultDTO.builder()
                .kind(kind)
                .namespace(namespace)
                .name(name)
                .action(action)
                .status("success")
                .message(dryRun ? "Dry run passed" : "Applied")
                .build();
    }

    private String applyDeployment(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        AppsV1Api api = new AppsV1Api(apiClient);
        V1Deployment body = Yaml.loadAs(document, V1Deployment.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsDeployment(api, namespace, name)) {
            call(() -> api.replaceNamespacedDeployment(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedDeployment(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyStatefulSet(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        AppsV1Api api = new AppsV1Api(apiClient);
        V1StatefulSet body = Yaml.loadAs(document, V1StatefulSet.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsStatefulSet(api, namespace, name)) {
            call(() -> api.replaceNamespacedStatefulSet(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedStatefulSet(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyDaemonSet(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        AppsV1Api api = new AppsV1Api(apiClient);
        V1DaemonSet body = Yaml.loadAs(document, V1DaemonSet.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsDaemonSet(api, namespace, name)) {
            call(() -> api.replaceNamespacedDaemonSet(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedDaemonSet(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyService(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        CoreV1Api api = new CoreV1Api(apiClient);
        V1Service body = Yaml.loadAs(document, V1Service.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsService(api, namespace, name)) {
            call(() -> api.replaceNamespacedService(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedService(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyConfigMap(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        CoreV1Api api = new CoreV1Api(apiClient);
        V1ConfigMap body = Yaml.loadAs(document, V1ConfigMap.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsConfigMap(api, namespace, name)) {
            call(() -> api.replaceNamespacedConfigMap(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedConfigMap(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applySecret(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        CoreV1Api api = new CoreV1Api(apiClient);
        V1Secret body = Yaml.loadAs(document, V1Secret.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsSecret(api, namespace, name)) {
            call(() -> api.replaceNamespacedSecret(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedSecret(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyIngress(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        NetworkingV1Api api = new NetworkingV1Api(apiClient);
        V1Ingress body = Yaml.loadAs(document, V1Ingress.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsIngress(api, namespace, name)) {
            call(() -> api.replaceNamespacedIngress(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedIngress(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyJob(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        BatchV1Api api = new BatchV1Api(apiClient);
        V1Job body = Yaml.loadAs(document, V1Job.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsJob(api, namespace, name)) {
            call(() -> api.replaceNamespacedJob(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedJob(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyCronJob(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        BatchV1Api api = new BatchV1Api(apiClient);
        V1CronJob body = Yaml.loadAs(document, V1CronJob.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsCronJob(api, namespace, name)) {
            call(() -> api.replaceNamespacedCronJob(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedCronJob(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyHpa(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        AutoscalingV2Api api = new AutoscalingV2Api(apiClient);
        V2HorizontalPodAutoscaler body = Yaml.loadAs(document, V2HorizontalPodAutoscaler.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsHpa(api, namespace, name)) {
            call(() -> api.replaceNamespacedHorizontalPodAutoscaler(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedHorizontalPodAutoscaler(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private String applyPvc(ApiClient apiClient, String document, String namespace, String name, String dryRunArg) {
        CoreV1Api api = new CoreV1Api(apiClient);
        V1PersistentVolumeClaim body = Yaml.loadAs(document, V1PersistentVolumeClaim.class);
        ensureMetadata(body.getMetadata(), namespace, name);
        if (existsPvc(api, namespace, name)) {
            call(() -> api.replaceNamespacedPersistentVolumeClaim(name, namespace, body, null, dryRunArg, null, null));
            return "updated";
        }
        call(() -> api.createNamespacedPersistentVolumeClaim(namespace, body, null, dryRunArg, null, null));
        return "created";
    }

    private boolean existsDeployment(AppsV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedDeployment(name, namespace, null));
    }

    private boolean existsStatefulSet(AppsV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedStatefulSet(name, namespace, null));
    }

    private boolean existsDaemonSet(AppsV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedDaemonSet(name, namespace, null));
    }

    private boolean existsService(CoreV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedService(name, namespace, null));
    }

    private boolean existsConfigMap(CoreV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedConfigMap(name, namespace, null));
    }

    private boolean existsSecret(CoreV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedSecret(name, namespace, null));
    }

    private boolean existsIngress(NetworkingV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedIngress(name, namespace, null));
    }

    private boolean existsJob(BatchV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedJob(name, namespace, null));
    }

    private boolean existsCronJob(BatchV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedCronJob(name, namespace, null));
    }

    private boolean existsHpa(AutoscalingV2Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedHorizontalPodAutoscaler(name, namespace, null));
    }

    private boolean existsPvc(CoreV1Api api, String namespace, String name) {
        return exists(() -> api.readNamespacedPersistentVolumeClaim(name, namespace, null));
    }

    private boolean exists(ApiCallable callable) {
        try {
            callable.call();
            return true;
        } catch (ApiException e) {
            if (e.getCode() == 404) {
                return false;
            }
            throw mapApiException(e, "Failed to check resource existence");
        } catch (Exception e) {
            throw new K8sException(500, "Failed to check resource existence: " + e.getMessage(), e);
        }
    }

    private void call(ApiCallable callable) {
        try {
            callable.call();
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to apply manifest resource");
        } catch (Exception e) {
            throw new K8sException(500, "Failed to apply manifest resource: " + e.getMessage(), e);
        }
    }

    private void ensureMetadata(V1ObjectMeta metadata, String namespace, String name) {
        if (metadata == null) {
            throw new K8sException(400, "metadata is required");
        }
        metadata.setNamespace(namespace);
        if (metadata.getName() == null || metadata.getName().isBlank()) {
            metadata.setName(name);
        }
    }

    private void validateManifest(String manifest) {
        if (manifest == null || manifest.isBlank()) {
            throw new K8sException(400, "manifest is required");
        }

        int size = manifest.getBytes(StandardCharsets.UTF_8).length;
        if (size > MAX_MANIFEST_BYTES) {
            throw new K8sException(400, "Manifest exceeds size limit (1 MiB)");
        }
    }

    private List<String> splitDocuments(String manifest) {
        String[] chunks = manifest.split("(?m)^---\\s*$");
        List<String> documents = new ArrayList<>();
        for (String chunk : chunks) {
            if (!chunk.isBlank()) {
                documents.add(chunk.trim());
            }
        }
        return documents;
    }

    @SuppressWarnings("unchecked")
    private String extractMetadataField(Map<?, ?> rawMap, String field) {
        Object metadataObj = rawMap.get("metadata");
        if (!(metadataObj instanceof Map<?, ?> metadata)) {
            return null;
        }
        Object value = metadata.get(field);
        return value instanceof String ? (String) value : null;
    }

    private String normalizeKind(String kind) {
        if (kind == null) {
            return "";
        }
        return kind.trim().toLowerCase(Locale.ROOT);
    }

    private void validateK8sName(String value, String fieldName) {
        if (!K8S_NAME_PATTERN.matcher(value).matches()) {
            throw new K8sException(400, fieldName + " is not a valid Kubernetes name: " + value);
        }
    }

    private K8sException mapApiException(ApiException e, String fallbackMessage) {
        int code = e.getCode();
        String body = e.getResponseBody();
        String message = Objects.requireNonNullElse(body, fallbackMessage);

        if (code == 401 || code == 403) {
            return new K8sException(403, message, e);
        }
        if (code == 404) {
            return new K8sException(404, message, e);
        }
        if (code == 409) {
            return new K8sException(409, message, e);
        }
        if (code >= 400 && code < 500) {
            return new K8sException(400, message, e);
        }
        return new K8sException(500, message, e);
    }

    @FunctionalInterface
    private interface ApiCallable {
        Object call() throws Exception;
    }
}
