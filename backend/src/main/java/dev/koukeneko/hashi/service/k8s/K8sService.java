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

import java.util.List;

public interface K8sService {

    K8sClusterStatusDTO getStatus();

    List<K8sNamespaceDTO> listNamespaces();

    List<K8sNodeDTO> listNodes();

    K8sPagedResponseDTO<K8sWorkloadDTO> listWorkloads(
            String namespace,
            String kind,
            String search,
            Integer page,
            Integer pageSize);

    K8sPagedResponseDTO<K8sPodDTO> listPods(
            String namespace,
            String search,
            Integer page,
            Integer pageSize);

    K8sPagedResponseDTO<K8sServiceDTO> listServices(
            String namespace,
            String search,
            Integer page,
            Integer pageSize);

    K8sActionResponseDTO restartWorkload(String namespace, String kind, String name);

    K8sActionResponseDTO scaleWorkload(String namespace, String kind, String name, int replicas);

    K8sActionResponseDTO deletePod(String namespace, String name, Integer graceSeconds);

    K8sApplyResponseDTO applyManifest(String manifest, String defaultNamespace, boolean dryRun);

    K8sConfigDTO getConfig();

    K8sActionResponseDTO updateConfig(String kubeconfigPath);

    K8sActionResponseDTO testConfig(String kubeconfigPath);

    K8sActionResponseDTO clearConfigOverride();
}
