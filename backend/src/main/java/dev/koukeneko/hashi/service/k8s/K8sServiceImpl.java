package dev.koukeneko.hashi.service.k8s;

import dev.koukeneko.hashi.model.dto.K8sActionResponseDTO;
import dev.koukeneko.hashi.model.dto.K8sApplyResponseDTO;
import dev.koukeneko.hashi.model.dto.K8sClusterStatusDTO;
import dev.koukeneko.hashi.model.dto.K8sConfigDTO;
import dev.koukeneko.hashi.model.dto.K8sNamespaceDTO;
import dev.koukeneko.hashi.model.dto.K8sNodeDTO;
import dev.koukeneko.hashi.model.dto.K8sPagedResponseDTO;
import dev.koukeneko.hashi.model.dto.K8sPodDTO;
import dev.koukeneko.hashi.model.dto.K8sServiceDTO;
import dev.koukeneko.hashi.model.dto.K8sWorkloadDTO;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.apis.AppsV1Api;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.apis.VersionApi;
import io.kubernetes.client.openapi.models.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class K8sServiceImpl implements K8sService {

    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 200;

    private static final Pattern K8S_NAME_PATTERN = Pattern.compile("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$");

    private static final Set<String> RESTARTABLE_KINDS = Set.of("deployment", "statefulset", "daemonset");
    private static final Set<String> SCALABLE_KINDS = Set.of("deployment", "statefulset", "daemonset");

    private final K8sConfigService configService;
    private final K8sClientProvider clientProvider;
    private final K8sYamlApplyService yamlApplyService;

    @Override
    public K8sClusterStatusDTO getStatus() {
        K8sConfigService.ResolvedConfig resolved = configService.resolveConfig();

        if (resolved.effectivePath() == null || resolved.effectivePath().isBlank()) {
            return K8sClusterStatusDTO.builder()
                    .connected(false)
                    .serverVersion(null)
                    .context(null)
                    .kubeconfigPath(null)
                    .kubeconfigSource(resolved.source())
                    .message("No kubeconfig found. Configure it in K3s Settings.")
                    .build();
        }

        try {
            ApiClient client = clientProvider.getClient();
            VersionApi versionApi = new VersionApi(client);
            VersionInfo versionInfo = versionApi.getCode();
            String serverVersion = versionInfo.getGitVersion() != null ? versionInfo.getGitVersion() : "unknown";

            return K8sClusterStatusDTO.builder()
                    .connected(true)
                    .serverVersion(serverVersion)
                    .context(clientProvider.getCurrentContext())
                    .kubeconfigPath(resolved.effectivePath())
                    .kubeconfigSource(resolved.source())
                    .message("Connected")
                    .build();
        } catch (K8sException e) {
            return K8sClusterStatusDTO.builder()
                    .connected(false)
                    .serverVersion(null)
                    .context(null)
                    .kubeconfigPath(resolved.effectivePath())
                    .kubeconfigSource(resolved.source())
                    .message(e.getMessage())
                    .build();
        } catch (ApiException e) {
            return K8sClusterStatusDTO.builder()
                    .connected(false)
                    .serverVersion(null)
                    .context(clientProvider.getCurrentContext())
                    .kubeconfigPath(resolved.effectivePath())
                    .kubeconfigSource(resolved.source())
                    .message(e.getResponseBody() != null ? e.getResponseBody() : e.getMessage())
                    .build();
        }
    }

    @Override
    public List<K8sNamespaceDTO> listNamespaces() {
        try {
            CoreV1Api api = coreV1();
            V1NamespaceList list = api.listNamespace(
                    null, null, null, null, null, null, null, null, null, null, false);

            return list.getItems().stream()
                    .map(ns -> K8sNamespaceDTO.builder()
                            .name(ns.getMetadata() != null ? ns.getMetadata().getName() : "-")
                            .phase(ns.getStatus() != null ? ns.getStatus().getPhase() : "Unknown")
                            .age(toAge(ns.getMetadata() != null ? ns.getMetadata().getCreationTimestamp() : null))
                            .build())
                    .sorted(Comparator.comparing(K8sNamespaceDTO::name))
                    .toList();
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to list namespaces");
        }
    }

    @Override
    public List<K8sNodeDTO> listNodes() {
        try {
            CoreV1Api api = coreV1();
            V1NodeList list = api.listNode(
                    null, null, null, null, null, null, null, null, null, null, false);

            return list.getItems().stream()
                    .map(node -> {
                        V1NodeStatus status = node.getStatus();
                        String internalIp = "-";
                        String nodeStatus = "Unknown";

                        if (status != null && status.getAddresses() != null) {
                            internalIp = status.getAddresses().stream()
                                    .filter(a -> "InternalIP".equals(a.getType()))
                                    .map(V1NodeAddress::getAddress)
                                    .findFirst()
                                    .orElse("-");
                        }

                        if (status != null && status.getConditions() != null) {
                            nodeStatus = status.getConditions().stream()
                                    .filter(c -> "Ready".equals(c.getType()))
                                    .map(c -> "True".equals(c.getStatus()) ? "Ready" : "NotReady")
                                    .findFirst()
                                    .orElse("Unknown");
                        }

                        String roles = "worker";
                        if (node.getMetadata() != null && node.getMetadata().getLabels() != null) {
                            roles = extractNodeRoles(node.getMetadata().getLabels());
                        }

                        return K8sNodeDTO.builder()
                                .name(node.getMetadata() != null ? node.getMetadata().getName() : "-")
                                .status(nodeStatus)
                                .roles(roles)
                                .version(node.getStatus() != null && node.getStatus().getNodeInfo() != null
                                        ? node.getStatus().getNodeInfo().getKubeletVersion()
                                        : "-")
                                .internalIp(internalIp)
                                .age(toAge(node.getMetadata() != null ? node.getMetadata().getCreationTimestamp() : null))
                                .build();
                    })
                    .sorted(Comparator.comparing(K8sNodeDTO::name))
                    .toList();
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to list nodes");
        }
    }

    @Override
    public K8sPagedResponseDTO<K8sWorkloadDTO> listWorkloads(
            String namespace,
            String kind,
            String search,
            Integer page,
            Integer pageSize) {

        String normalizedKind = normalizeKind(kind);
        String normalizedNamespace = normalizeNamespace(namespace);
        String normalizedSearch = normalizeSearch(search);

        List<K8sWorkloadDTO> workloads = new ArrayList<>();

        if (normalizedKind == null || normalizedKind.equals("deployment")) {
            workloads.addAll(listDeploymentWorkloads(normalizedNamespace));
        }
        if (normalizedKind == null || normalizedKind.equals("statefulset")) {
            workloads.addAll(listStatefulSetWorkloads(normalizedNamespace));
        }
        if (normalizedKind == null || normalizedKind.equals("daemonset")) {
            workloads.addAll(listDaemonSetWorkloads(normalizedNamespace));
        }

        List<K8sWorkloadDTO> filtered = workloads.stream()
                .filter(w -> normalizedSearch == null || w.name().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .sorted(Comparator.comparing(K8sWorkloadDTO::namespace).thenComparing(K8sWorkloadDTO::name))
                .toList();

        return paginate(filtered, page, pageSize);
    }

    @Override
    public K8sPagedResponseDTO<K8sPodDTO> listPods(String namespace, String search, Integer page, Integer pageSize) {
        try {
            CoreV1Api api = coreV1();
            String normalizedNamespace = normalizeNamespace(namespace);
            String normalizedSearch = normalizeSearch(search);

            V1PodList list = normalizedNamespace == null
                    ? api.listPodForAllNamespaces(null, null, null, null, null, null, null, null, null, null, false)
                    : api.listNamespacedPod(normalizedNamespace, null, null, null, null, null, null, null, null, null,
                            false);

            List<K8sPodDTO> pods = list.getItems().stream().map(pod -> {
                V1PodStatus status = pod.getStatus();
                String podStatus = status != null && status.getPhase() != null ? status.getPhase() : "Unknown";
                String node = pod.getSpec() != null && pod.getSpec().getNodeName() != null
                        ? pod.getSpec().getNodeName()
                        : "-";

                List<V1ContainerStatus> containerStatuses = status != null ? status.getContainerStatuses() : null;
                int readyCount = 0;
                int totalCount = 0;
                int restartCount = 0;
                List<String> containers = new ArrayList<>();

                if (containerStatuses != null) {
                    totalCount = containerStatuses.size();
                    readyCount = (int) containerStatuses.stream()
                            .filter(containerStatus -> Boolean.TRUE.equals(containerStatus.getReady()))
                            .count();
                    restartCount = containerStatuses.stream()
                            .map(V1ContainerStatus::getRestartCount)
                            .filter(v -> v != null)
                            .mapToInt(Integer::intValue)
                            .sum();
                    containers = containerStatuses.stream()
                            .map(V1ContainerStatus::getName)
                            .filter(n -> n != null && !n.isBlank())
                            .toList();
                }

                if (containers.isEmpty() && pod.getSpec() != null && pod.getSpec().getContainers() != null) {
                    containers = pod.getSpec().getContainers().stream()
                            .map(V1Container::getName)
                            .filter(n -> n != null && !n.isBlank())
                            .toList();
                    totalCount = containers.size();
                }

                return K8sPodDTO.builder()
                        .namespace(pod.getMetadata() != null ? pod.getMetadata().getNamespace() : "default")
                        .name(pod.getMetadata() != null ? pod.getMetadata().getName() : "-")
                        .status(podStatus)
                        .node(node)
                        .ready(readyCount + "/" + totalCount)
                        .restarts(restartCount)
                        .age(toAge(pod.getMetadata() != null ? pod.getMetadata().getCreationTimestamp() : null))
                        .containers(containers)
                        .build();
            }).filter(p -> normalizedSearch == null || p.name().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                    .sorted(Comparator.comparing(K8sPodDTO::namespace).thenComparing(K8sPodDTO::name))
                    .toList();

            return paginate(pods, page, pageSize);
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to list pods");
        }
    }

    @Override
    public K8sPagedResponseDTO<K8sServiceDTO> listServices(String namespace, String search, Integer page,
            Integer pageSize) {
        try {
            CoreV1Api api = coreV1();
            String normalizedNamespace = normalizeNamespace(namespace);
            String normalizedSearch = normalizeSearch(search);

            V1ServiceList list = normalizedNamespace == null
                    ? api.listServiceForAllNamespaces(null, null, null, null, null, null, null, null, null, null,
                            false)
                    : api.listNamespacedService(normalizedNamespace, null, null, null, null, null, null, null, null,
                            null, false);

            List<K8sServiceDTO> services = list.getItems().stream().map(svc -> {
                V1ServiceSpec spec = svc.getSpec();
                String ports = "-";
                if (spec != null && spec.getPorts() != null && !spec.getPorts().isEmpty()) {
                    ports = spec.getPorts().stream()
                            .map(p -> p.getPort() + "/" + (p.getProtocol() != null ? p.getProtocol() : "TCP"))
                            .collect(Collectors.joining(", "));
                }

                String externalIp = "-";
                if (svc.getStatus() != null && svc.getStatus().getLoadBalancer() != null
                        && svc.getStatus().getLoadBalancer().getIngress() != null
                        && !svc.getStatus().getLoadBalancer().getIngress().isEmpty()) {
                    V1LoadBalancerIngress ingress = svc.getStatus().getLoadBalancer().getIngress().get(0);
                    externalIp = ingress.getIp() != null ? ingress.getIp() : ingress.getHostname();
                } else if (spec != null && spec.getExternalIPs() != null && !spec.getExternalIPs().isEmpty()) {
                    externalIp = String.join(", ", spec.getExternalIPs());
                }

                return K8sServiceDTO.builder()
                        .namespace(svc.getMetadata() != null ? svc.getMetadata().getNamespace() : "default")
                        .name(svc.getMetadata() != null ? svc.getMetadata().getName() : "-")
                        .type(spec != null && spec.getType() != null ? spec.getType() : "ClusterIP")
                        .clusterIp(spec != null ? spec.getClusterIP() : "-")
                        .externalIp(externalIp != null ? externalIp : "-")
                        .ports(ports)
                        .age(toAge(svc.getMetadata() != null ? svc.getMetadata().getCreationTimestamp() : null))
                        .build();
            }).filter(s -> normalizedSearch == null || s.name().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                    .sorted(Comparator.comparing(K8sServiceDTO::namespace).thenComparing(K8sServiceDTO::name))
                    .toList();

            return paginate(services, page, pageSize);
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to list services");
        }
    }

    @Override
    public K8sActionResponseDTO restartWorkload(String namespace, String kind, String name) {
        long startedAt = System.nanoTime();
        String normalizedKind = normalizeRequiredKind(kind, RESTARTABLE_KINDS, "restart");
        String normalizedNamespace = validateRequiredK8sName(namespace, "namespace");
        String normalizedName = validateRequiredK8sName(name, "name");

        AppsV1Api api = appsV1();
        String restartValue = Instant.now().toString();

        try {
            switch (normalizedKind) {
                case "deployment" -> {
                    V1Deployment deployment = api.readNamespacedDeployment(normalizedName, normalizedNamespace, null);
                    applyRestartAnnotation(deployment.getSpec() != null ? deployment.getSpec().getTemplate() : null,
                            restartValue);
                    api.replaceNamespacedDeployment(normalizedName, normalizedNamespace, deployment, null, null, null,
                            null);
                }
                case "statefulset" -> {
                    V1StatefulSet statefulSet = api.readNamespacedStatefulSet(normalizedName, normalizedNamespace,
                            null);
                    applyRestartAnnotation(statefulSet.getSpec() != null ? statefulSet.getSpec().getTemplate() : null,
                            restartValue);
                    api.replaceNamespacedStatefulSet(normalizedName, normalizedNamespace, statefulSet, null, null,
                            null, null);
                }
                case "daemonset" -> {
                    V1DaemonSet daemonSet = api.readNamespacedDaemonSet(normalizedName, normalizedNamespace, null);
                    applyRestartAnnotation(daemonSet.getSpec() != null ? daemonSet.getSpec().getTemplate() : null,
                            restartValue);
                    api.replaceNamespacedDaemonSet(normalizedName, normalizedNamespace, daemonSet, null, null, null,
                            null);
                }
                default -> throw new K8sException(400, "Unsupported workload kind: " + normalizedKind);
            }

            audit("restart", normalizedNamespace, normalizedKind, normalizedName, startedAt, true, "ok");
            return K8sActionResponseDTO.builder()
                    .success(true)
                    .message("Restart requested for " + normalizedKind + " " + normalizedNamespace + "/" + normalizedName)
                    .build();
        } catch (ApiException e) {
            K8sException mapped = mapApiException(e, "Failed to restart workload");
            audit("restart", normalizedNamespace, normalizedKind, normalizedName, startedAt, false, mapped.getMessage());
            throw mapped;
        }
    }

    @Override
    public K8sActionResponseDTO scaleWorkload(String namespace, String kind, String name, int replicas) {
        long startedAt = System.nanoTime();

        String normalizedKind = normalizeRequiredKind(kind, SCALABLE_KINDS, "scale");
        String normalizedNamespace = validateRequiredK8sName(namespace, "namespace");
        String normalizedName = validateRequiredK8sName(name, "name");

        if (replicas < 0 || replicas > 1000) {
            throw new K8sException(400, "replicas must be between 0 and 1000");
        }

        AppsV1Api api = appsV1();

        try {
            switch (normalizedKind) {
                case "deployment" -> {
                    V1Deployment deployment = api.readNamespacedDeployment(normalizedName, normalizedNamespace, null);
                    if (deployment.getSpec() == null) {
                        throw new K8sException(400, "Deployment spec is missing");
                    }
                    deployment.getSpec().setReplicas(replicas);
                    api.replaceNamespacedDeployment(normalizedName, normalizedNamespace, deployment, null, null, null,
                            null);
                }
                case "statefulset" -> {
                    V1StatefulSet statefulSet = api.readNamespacedStatefulSet(normalizedName, normalizedNamespace,
                            null);
                    if (statefulSet.getSpec() == null) {
                        throw new K8sException(400, "StatefulSet spec is missing");
                    }
                    statefulSet.getSpec().setReplicas(replicas);
                    api.replaceNamespacedStatefulSet(normalizedName, normalizedNamespace, statefulSet, null, null,
                            null, null);
                }
                case "daemonset" -> throw new K8sException(400, "DaemonSet does not support manual replica scaling");
                default -> throw new K8sException(400, "Unsupported workload kind: " + normalizedKind);
            }

            audit("scale", normalizedNamespace, normalizedKind, normalizedName, startedAt, true,
                    "replicas=" + replicas);
            return K8sActionResponseDTO.builder()
                    .success(true)
                    .message("Scaled " + normalizedKind + " " + normalizedNamespace + "/" + normalizedName)
                    .replicas(replicas)
                    .build();
        } catch (ApiException e) {
            K8sException mapped = mapApiException(e, "Failed to scale workload");
            audit("scale", normalizedNamespace, normalizedKind, normalizedName, startedAt, false, mapped.getMessage());
            throw mapped;
        }
    }

    @Override
    public K8sActionResponseDTO deletePod(String namespace, String name, Integer graceSeconds) {
        long startedAt = System.nanoTime();

        String normalizedNamespace = validateRequiredK8sName(namespace, "namespace");
        String normalizedName = validateRequiredK8sName(name, "name");

        Integer grace = graceSeconds;
        if (grace != null && grace < 0) {
            throw new K8sException(400, "graceSeconds must be >= 0");
        }

        try {
            CoreV1Api api = coreV1();
            api.deleteNamespacedPod(normalizedName, normalizedNamespace, null, null, grace, null, null, null);
            audit("delete-pod", normalizedNamespace, "pod", normalizedName, startedAt, true, "ok");
            return K8sActionResponseDTO.builder()
                    .success(true)
                    .message("Delete requested for pod " + normalizedNamespace + "/" + normalizedName)
                    .build();
        } catch (ApiException e) {
            K8sException mapped = mapApiException(e, "Failed to delete pod");
            audit("delete-pod", normalizedNamespace, "pod", normalizedName, startedAt, false, mapped.getMessage());
            throw mapped;
        }
    }

    @Override
    public K8sApplyResponseDTO applyManifest(String manifest, String defaultNamespace, boolean dryRun) {
        if (defaultNamespace != null && !defaultNamespace.isBlank()) {
            validateRequiredK8sName(defaultNamespace, "defaultNamespace");
        }
        return yamlApplyService.applyManifest(clientProvider.getClient(), manifest, defaultNamespace, dryRun);
    }

    @Override
    public K8sConfigDTO getConfig() {
        K8sConfigService.ResolvedConfig resolved = configService.resolveConfig();

        return K8sConfigDTO.builder()
                .effectivePath(resolved.effectivePath())
                .source(resolved.source())
                .overridePath(resolved.overridePath())
                .canEdit(configService.canEdit())
                .build();
    }

    @Override
    public K8sActionResponseDTO updateConfig(String kubeconfigPath) {
        configService.saveOverridePath(kubeconfigPath);
        clientProvider.invalidateCache();

        K8sConfigService.ResolvedConfig resolved = configService.resolveConfig();
        return K8sActionResponseDTO.builder()
                .success(true)
                .message("Kubeconfig override saved")
                .effectivePath(resolved.effectivePath())
                .source(resolved.source())
                .build();
    }

    @Override
    public K8sActionResponseDTO testConfig(String kubeconfigPath) {
        K8sClientProvider.ConnectionTestResult result = clientProvider.testConnection(kubeconfigPath);
        return K8sActionResponseDTO.builder()
                .success(result.success())
                .message(result.message())
                .serverVersion(result.serverVersion())
                .build();
    }

    @Override
    public K8sActionResponseDTO clearConfigOverride() {
        configService.clearOverridePath();
        clientProvider.invalidateCache();

        K8sConfigService.ResolvedConfig resolved = configService.resolveConfig();
        return K8sActionResponseDTO.builder()
                .success(true)
                .message("Kubeconfig override cleared")
                .effectivePath(resolved.effectivePath())
                .source(resolved.source())
                .build();
    }

    private List<K8sWorkloadDTO> listDeploymentWorkloads(String namespace) {
        try {
            AppsV1Api api = appsV1();
            V1DeploymentList list = namespace == null
                    ? api.listDeploymentForAllNamespaces(null, null, null, null, null, null, null, null, null, null,
                            false)
                    : api.listNamespacedDeployment(namespace, null, null, null, null, null, null, null, null, null,
                            null,
                            false);

            return list.getItems().stream()
                    .map(d -> {
                        Integer replicas = d.getSpec() != null ? d.getSpec().getReplicas() : 0;
                        Integer readyReplicas = d.getStatus() != null && d.getStatus().getReadyReplicas() != null
                                ? d.getStatus().getReadyReplicas()
                                : 0;
                        return K8sWorkloadDTO.builder()
                                .namespace(d.getMetadata() != null ? d.getMetadata().getNamespace() : "default")
                                .kind("deployment")
                                .name(d.getMetadata() != null ? d.getMetadata().getName() : "-")
                                .ready(readyReplicas + "/" + replicas)
                                .replicas(replicas)
                                .availableReplicas(d.getStatus() != null ? d.getStatus().getAvailableReplicas() : 0)
                                .age(toAge(d.getMetadata() != null ? d.getMetadata().getCreationTimestamp() : null))
                                .build();
                    })
                    .toList();
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to list deployments");
        }
    }

    private List<K8sWorkloadDTO> listStatefulSetWorkloads(String namespace) {
        try {
            AppsV1Api api = appsV1();
            V1StatefulSetList list = namespace == null
                    ? api.listStatefulSetForAllNamespaces(null, null, null, null, null, null, null, null, null,
                            null, false)
                    : api.listNamespacedStatefulSet(namespace, null, null, null, null, null, null, null, null, null,
                            null,
                            false);

            return list.getItems().stream()
                    .map(s -> {
                        Integer replicas = s.getSpec() != null ? s.getSpec().getReplicas() : 0;
                        Integer readyReplicas = s.getStatus() != null && s.getStatus().getReadyReplicas() != null
                                ? s.getStatus().getReadyReplicas()
                                : 0;
                        return K8sWorkloadDTO.builder()
                                .namespace(s.getMetadata() != null ? s.getMetadata().getNamespace() : "default")
                                .kind("statefulset")
                                .name(s.getMetadata() != null ? s.getMetadata().getName() : "-")
                                .ready(readyReplicas + "/" + replicas)
                                .replicas(replicas)
                                .availableReplicas(readyReplicas)
                                .age(toAge(s.getMetadata() != null ? s.getMetadata().getCreationTimestamp() : null))
                                .build();
                    })
                    .toList();
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to list statefulsets");
        }
    }

    private List<K8sWorkloadDTO> listDaemonSetWorkloads(String namespace) {
        try {
            AppsV1Api api = appsV1();
            V1DaemonSetList list = namespace == null
                    ? api.listDaemonSetForAllNamespaces(null, null, null, null, null, null, null, null, null, null,
                            false)
                    : api.listNamespacedDaemonSet(namespace, null, null, null, null, null, null, null, null, null,
                            null,
                            false);

            return list.getItems().stream()
                    .map(d -> {
                        Integer desired = d.getStatus() != null ? d.getStatus().getDesiredNumberScheduled() : 0;
                        Integer ready = d.getStatus() != null ? d.getStatus().getNumberReady() : 0;
                        return K8sWorkloadDTO.builder()
                                .namespace(d.getMetadata() != null ? d.getMetadata().getNamespace() : "default")
                                .kind("daemonset")
                                .name(d.getMetadata() != null ? d.getMetadata().getName() : "-")
                                .ready(ready + "/" + desired)
                                .replicas(desired)
                                .availableReplicas(ready)
                                .age(toAge(d.getMetadata() != null ? d.getMetadata().getCreationTimestamp() : null))
                                .build();
                    })
                    .toList();
        } catch (ApiException e) {
            throw mapApiException(e, "Failed to list daemonsets");
        }
    }

    private <T> K8sPagedResponseDTO<T> paginate(List<T> items, Integer page, Integer pageSize) {
        int safePage = page != null && page > 0 ? page : DEFAULT_PAGE;
        int safePageSize = pageSize != null && pageSize > 0 ? Math.min(pageSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

        int total = items.size();
        int from = Math.min((safePage - 1) * safePageSize, total);
        int to = Math.min(from + safePageSize, total);

        return K8sPagedResponseDTO.<T>builder()
                .items(items.subList(from, to))
                .total(total)
                .page(safePage)
                .pageSize(safePageSize)
                .build();
    }

    private AppsV1Api appsV1() {
        return new AppsV1Api(clientProvider.getClient());
    }

    private CoreV1Api coreV1() {
        return new CoreV1Api(clientProvider.getClient());
    }

    private String normalizeKind(String kind) {
        if (kind == null || kind.isBlank()) {
            return null;
        }
        String normalized = kind.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("deployment", "statefulset", "daemonset").contains(normalized)) {
            throw new K8sException(400, "Unsupported kind filter: " + kind);
        }
        return normalized;
    }

    private String normalizeNamespace(String namespace) {
        if (namespace == null || namespace.isBlank() || "all".equalsIgnoreCase(namespace)) {
            return null;
        }
        return validateRequiredK8sName(namespace, "namespace");
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.toLowerCase(Locale.ROOT).trim();
    }

    private String normalizeRequiredKind(String kind, Set<String> allowed, String action) {
        if (kind == null || kind.isBlank()) {
            throw new K8sException(400, "kind is required for " + action);
        }
        String normalized = kind.trim().toLowerCase(Locale.ROOT);
        if (!allowed.contains(normalized)) {
            throw new K8sException(400, "Unsupported kind for " + action + ": " + kind);
        }
        return normalized;
    }

    private String validateRequiredK8sName(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new K8sException(400, fieldName + " is required");
        }
        if (!K8S_NAME_PATTERN.matcher(value).matches()) {
            throw new K8sException(400, fieldName + " is not a valid Kubernetes name: " + value);
        }
        return value;
    }

    private void applyRestartAnnotation(V1PodTemplateSpec template, String restartedAt) {
        if (template == null) {
            throw new K8sException(400, "Workload template is missing");
        }

        V1ObjectMeta metadata = template.getMetadata();
        if (metadata == null) {
            metadata = new V1ObjectMeta();
            template.setMetadata(metadata);
        }

        Map<String, String> annotations = metadata.getAnnotations();
        if (annotations == null) {
            annotations = new HashMap<>();
            metadata.setAnnotations(annotations);
        }

        annotations.put("kubectl.kubernetes.io/restartedAt", restartedAt);
    }

    private String extractNodeRoles(Map<String, String> labels) {
        List<String> roles = labels.keySet().stream()
                .filter(k -> k.startsWith("node-role.kubernetes.io/"))
                .map(k -> {
                    String role = k.substring("node-role.kubernetes.io/".length());
                    return role.isBlank() ? "control-plane" : role;
                })
                .toList();

        if (roles.isEmpty()) {
            if (labels.containsKey("kubernetes.io/role")) {
                return labels.get("kubernetes.io/role");
            }
            return "worker";
        }
        return String.join(",", roles);
    }

    private String toAge(OffsetDateTime createdAt) {
        if (createdAt == null) {
            return "-";
        }

        try {
            Duration duration = Duration.between(createdAt.toInstant(), Instant.now());
            long days = duration.toDays();
            if (days > 0) {
                return days + "d";
            }
            long hours = duration.toHours();
            if (hours > 0) {
                return hours + "h";
            }
            long minutes = duration.toMinutes();
            if (minutes > 0) {
                return minutes + "m";
            }
            return Math.max(duration.getSeconds(), 0) + "s";
        } catch (DateTimeParseException e) {
            return "-";
        }
    }

    private K8sException mapApiException(ApiException e, String fallbackMessage) {
        int code = e.getCode();
        String body = e.getResponseBody();
        String message = (body != null && !body.isBlank()) ? body : fallbackMessage;

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

    private void audit(String action, String namespace, String kind, String name, long startedAt, boolean success,
            String message) {
        long latencyMs = (System.nanoTime() - startedAt) / 1_000_000;
        log.info("[K8S_AUDIT] action={} namespace={} kind={} name={} success={} latencyMs={} message={}",
                action,
                namespace,
                kind,
                name,
                success,
                latencyMs,
                message);
    }
}
