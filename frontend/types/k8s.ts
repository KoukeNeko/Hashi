/**
 * Kubernetes (K3s) related types
 */

/** Cluster connectivity and version status */
export interface K8sClusterStatus {
    connected: boolean;
    serverVersion: string | null;
    context: string | null;
    kubeconfigPath: string | null;
    kubeconfigSource: string;
    message: string;
}

/** Namespace summary */
export interface K8sNamespace {
    name: string;
    phase: string;
    age: string;
}

/** Node summary */
export interface K8sNode {
    name: string;
    status: string;
    roles: string;
    version: string;
    internalIp: string;
    age: string;
}

/** Workload item (Deployment/StatefulSet/DaemonSet) */
export interface K8sWorkload {
    namespace: string;
    kind: 'deployment' | 'statefulset' | 'daemonset' | string;
    name: string;
    ready: string;
    replicas: number;
    availableReplicas: number;
    age: string;
}

/** Pod item */
export interface K8sPod {
    namespace: string;
    name: string;
    status: string;
    node: string;
    ready: string;
    restarts: number;
    age: string;
    containers: string[];
}

/** Service item */
export interface K8sService {
    namespace: string;
    name: string;
    type: string;
    clusterIp: string;
    externalIp: string;
    ports: string;
    age: string;
}

/** Generic paged response */
export interface K8sPagedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

/** Apply request payload */
export interface K8sApplyRequest {
    manifest: string;
    defaultNamespace?: string;
    dryRun?: boolean;
}

/** Single apply result row */
export interface K8sApplyResult {
    kind: string;
    namespace: string;
    name: string;
    action: string;
    status: 'success' | 'error' | string;
    message: string;
}

/** Apply response payload */
export interface K8sApplyResponse {
    success: boolean;
    dryRun: boolean;
    results: K8sApplyResult[];
    warnings: string[];
}

/** Kubeconfig status */
export interface K8sConfig {
    effectivePath: string | null;
    source: string;
    overridePath: string | null;
    canEdit: boolean;
}

/** Common action response for k8s operations */
export interface K8sActionResponse {
    success: boolean;
    message: string;
    replicas?: number;
    serverVersion?: string;
    effectivePath?: string;
    source?: string;
}

/** Platform feature flags returned by backend */
export interface PlatformFeatures {
    serviceManager: boolean;
    ufwFirewall: boolean;
    iptables: boolean;
    windowsFirewall: boolean;
    scheduler: boolean;
    terminal: boolean;
    logStream: boolean;
    userManagement: boolean;
    k8sManager?: boolean;
}
