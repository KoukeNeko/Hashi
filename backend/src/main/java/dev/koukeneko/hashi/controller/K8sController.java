package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.K8sActionResponseDTO;
import dev.koukeneko.hashi.model.dto.K8sApplyRequestDTO;
import dev.koukeneko.hashi.model.dto.K8sApplyResponseDTO;
import dev.koukeneko.hashi.model.dto.K8sClusterStatusDTO;
import dev.koukeneko.hashi.model.dto.K8sConfigDTO;
import dev.koukeneko.hashi.model.dto.K8sConfigTestRequestDTO;
import dev.koukeneko.hashi.model.dto.K8sConfigUpdateRequestDTO;
import dev.koukeneko.hashi.model.dto.K8sNamespaceDTO;
import dev.koukeneko.hashi.model.dto.K8sNodeDTO;
import dev.koukeneko.hashi.model.dto.K8sPagedResponseDTO;
import dev.koukeneko.hashi.model.dto.K8sPodDTO;
import dev.koukeneko.hashi.model.dto.K8sScaleRequestDTO;
import dev.koukeneko.hashi.model.dto.K8sServiceDTO;
import dev.koukeneko.hashi.model.dto.K8sWorkloadDTO;
import dev.koukeneko.hashi.service.k8s.K8sException;
import dev.koukeneko.hashi.service.k8s.K8sService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/k8s")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class K8sController {

    private final K8sService k8sService;

    @GetMapping("/status")
    public ResponseEntity<K8sClusterStatusDTO> getStatus() {
        return ResponseEntity.ok(k8sService.getStatus());
    }

    @GetMapping("/namespaces")
    public ResponseEntity<List<K8sNamespaceDTO>> listNamespaces() {
        return ResponseEntity.ok(k8sService.listNamespaces());
    }

    @GetMapping("/nodes")
    public ResponseEntity<List<K8sNodeDTO>> listNodes() {
        return ResponseEntity.ok(k8sService.listNodes());
    }

    @GetMapping("/workloads")
    public ResponseEntity<K8sPagedResponseDTO<K8sWorkloadDTO>> listWorkloads(
            @RequestParam(required = false) String namespace,
            @RequestParam(required = false) String kind,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize) {
        return ResponseEntity.ok(k8sService.listWorkloads(namespace, kind, search, page, pageSize));
    }

    @GetMapping("/pods")
    public ResponseEntity<K8sPagedResponseDTO<K8sPodDTO>> listPods(
            @RequestParam(required = false) String namespace,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize) {
        return ResponseEntity.ok(k8sService.listPods(namespace, search, page, pageSize));
    }

    @GetMapping("/services")
    public ResponseEntity<K8sPagedResponseDTO<K8sServiceDTO>> listServices(
            @RequestParam(required = false) String namespace,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize) {
        return ResponseEntity.ok(k8sService.listServices(namespace, search, page, pageSize));
    }

    @PostMapping("/workloads/{namespace}/{kind}/{name}/restart")
    public ResponseEntity<K8sActionResponseDTO> restartWorkload(
            @PathVariable String namespace,
            @PathVariable String kind,
            @PathVariable String name) {
        return ResponseEntity.ok(k8sService.restartWorkload(namespace, kind, name));
    }

    @PostMapping("/workloads/{namespace}/{kind}/{name}/scale")
    public ResponseEntity<K8sActionResponseDTO> scaleWorkload(
            @PathVariable String namespace,
            @PathVariable String kind,
            @PathVariable String name,
            @RequestBody K8sScaleRequestDTO request) {
        Integer replicas = request != null ? request.getReplicas() : null;
        if (replicas == null) {
            throw new K8sException(400, "replicas is required");
        }
        return ResponseEntity.ok(k8sService.scaleWorkload(namespace, kind, name, replicas));
    }

    @DeleteMapping("/pods/{namespace}/{name}")
    public ResponseEntity<K8sActionResponseDTO> deletePod(
            @PathVariable String namespace,
            @PathVariable String name,
            @RequestParam(required = false) Integer graceSeconds) {
        return ResponseEntity.ok(k8sService.deletePod(namespace, name, graceSeconds));
    }

    @PostMapping("/apply")
    public ResponseEntity<K8sApplyResponseDTO> applyManifest(
            @RequestBody K8sApplyRequestDTO request) {
        if (request == null) {
            throw new K8sException(400, "Request body is required");
        }

        boolean dryRun = Boolean.TRUE.equals(request.getDryRun());
        return ResponseEntity.ok(k8sService.applyManifest(request.getManifest(), request.getDefaultNamespace(), dryRun));
    }

    @GetMapping("/config")
    public ResponseEntity<K8sConfigDTO> getConfig() {
        return ResponseEntity.ok(k8sService.getConfig());
    }

    @PutMapping("/config")
    public ResponseEntity<K8sActionResponseDTO> updateConfig(@RequestBody K8sConfigUpdateRequestDTO request) {
        if (request == null || request.getKubeconfigPath() == null || request.getKubeconfigPath().isBlank()) {
            throw new K8sException(400, "kubeconfigPath is required");
        }
        return ResponseEntity.ok(k8sService.updateConfig(request.getKubeconfigPath()));
    }

    @PostMapping("/config/test")
    public ResponseEntity<K8sActionResponseDTO> testConfig(@RequestBody K8sConfigTestRequestDTO request) {
        if (request == null || request.getKubeconfigPath() == null || request.getKubeconfigPath().isBlank()) {
            throw new K8sException(400, "kubeconfigPath is required");
        }
        return ResponseEntity.ok(k8sService.testConfig(request.getKubeconfigPath()));
    }

    @DeleteMapping("/config/override")
    public ResponseEntity<K8sActionResponseDTO> clearOverride() {
        return ResponseEntity.ok(k8sService.clearConfigOverride());
    }

    @ExceptionHandler(K8sException.class)
    public ResponseEntity<Map<String, String>> handleK8sException(K8sException e) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        return ResponseEntity.status(status).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleOtherException(Exception e) {
        log.error("Unhandled k8s controller error", e);
        return ResponseEntity.internalServerError().body(Map.of("message", "Internal server error"));
    }
}
