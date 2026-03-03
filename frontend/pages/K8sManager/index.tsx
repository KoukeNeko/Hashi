import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Server,
    RefreshCw,
    Boxes,
    Package2,
    Trash2,
    Play,
    Scale,
    Search,
    FileCode2,
    Settings,
    Terminal,
    X,
    Download,
    Pause,
} from 'lucide-react';
import { PageHeader, CodeEditor, Toast } from '../../components';
import { Tabs, ActionButton } from '../../components/ui';
import {
    K8sActionResponse,
    K8sApplyResponse,
    K8sClusterStatus,
    K8sConfig,
    K8sNamespace,
    K8sNode,
    K8sPagedResponse,
    K8sPod,
    K8sService as K8sServiceItem,
    K8sWorkload,
} from '../../types';
import { K8sService } from '../../services/api';

type K8sTab = 'overview' | 'workloads' | 'pods' | 'services' | 'apply' | 'settings';

const DEFAULT_MANIFEST = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
    spec:
      containers:
        - name: app
          image: nginx:stable`;

const K8sManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<K8sTab>('overview');

    const [status, setStatus] = useState<K8sClusterStatus | null>(null);
    const [config, setConfig] = useState<K8sConfig | null>(null);
    const [namespaces, setNamespaces] = useState<K8sNamespace[]>([]);
    const [nodes, setNodes] = useState<K8sNode[]>([]);

    const [namespaceFilter, setNamespaceFilter] = useState('all');

    const [workloads, setWorkloads] = useState<K8sPagedResponse<K8sWorkload> | null>(null);
    const [workloadKind, setWorkloadKind] = useState<'all' | 'deployment' | 'statefulset' | 'daemonset'>('all');
    const [workloadSearch, setWorkloadSearch] = useState('');
    const [workloadPage, setWorkloadPage] = useState(1);

    const [pods, setPods] = useState<K8sPagedResponse<K8sPod> | null>(null);
    const [podSearch, setPodSearch] = useState('');
    const [podPage, setPodPage] = useState(1);

    const [services, setServices] = useState<K8sPagedResponse<K8sServiceItem> | null>(null);
    const [serviceSearch, setServiceSearch] = useState('');
    const [servicePage, setServicePage] = useState(1);

    const [manifest, setManifest] = useState(DEFAULT_MANIFEST);
    const [defaultNamespace, setDefaultNamespace] = useState('default');
    const [applyResult, setApplyResult] = useState<K8sApplyResponse | null>(null);

    const [configPathInput, setConfigPathInput] = useState('');

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const [logPod, setLogPod] = useState<K8sPod | null>(null);
    const [logContainer, setLogContainer] = useState('');
    const [logLines, setLogLines] = useState<string[]>([]);
    const [logPaused, setLogPaused] = useState(false);
    const [logConnected, setLogConnected] = useState(false);
    const [logTailLines, setLogTailLines] = useState(200);
    const [logAutoScroll, setLogAutoScroll] = useState(true);
    const logPausedRef = useRef(false);

    const wsRef = useRef<WebSocket | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const namespaceOptions = useMemo(() => ['all', ...namespaces.map((n) => n.name)], [namespaces]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
    };

    const selectedNamespace = namespaceFilter === 'all' ? undefined : namespaceFilter;

    const loadOverview = useCallback(async () => {
        const [clusterStatus, ns, nodeList, cfg] = await Promise.all([
            K8sService.getStatus(),
            K8sService.listNamespaces(),
            K8sService.listNodes(),
            K8sService.getConfig(),
        ]);

        setStatus(clusterStatus);
        setNamespaces(ns);
        setNodes(nodeList);
        setConfig(cfg);
        setConfigPathInput((prev) => {
            if (cfg.overridePath) {
                return cfg.overridePath;
            }
            if (!prev) {
                return cfg.effectivePath || '';
            }
            return prev;
        });
    }, []);

    const loadWorkloads = useCallback(async () => {
        const data = await K8sService.listWorkloads({
            namespace: selectedNamespace,
            kind: workloadKind === 'all' ? undefined : workloadKind,
            search: workloadSearch || undefined,
            page: workloadPage,
            pageSize: 50,
        });
        setWorkloads(data);
    }, [selectedNamespace, workloadKind, workloadSearch, workloadPage]);

    const loadPods = useCallback(async () => {
        const data = await K8sService.listPods({
            namespace: selectedNamespace,
            search: podSearch || undefined,
            page: podPage,
            pageSize: 50,
        });
        setPods(data);
    }, [selectedNamespace, podSearch, podPage]);

    const loadServices = useCallback(async () => {
        const data = await K8sService.listServices({
            namespace: selectedNamespace,
            search: serviceSearch || undefined,
            page: servicePage,
            pageSize: 50,
        });
        setServices(data);
    }, [selectedNamespace, serviceSearch, servicePage]);

    const refreshActiveTab = useCallback(async () => {
        setLoading(true);
        try {
            await loadOverview();
            if (activeTab === 'workloads') await loadWorkloads();
            if (activeTab === 'pods') await loadPods();
            if (activeTab === 'services') await loadServices();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || error?.message || 'Failed to refresh data');
        } finally {
            setLoading(false);
        }
    }, [activeTab, loadOverview, loadPods, loadServices, loadWorkloads]);

    useEffect(() => {
        refreshActiveTab();
    }, [refreshActiveTab]);

    useEffect(() => {
        if (activeTab === 'workloads') {
            loadWorkloads().catch((error: any) => {
                showToast('error', error?.response?.data?.message || 'Failed to load workloads');
            });
        }
    }, [activeTab, loadWorkloads]);

    useEffect(() => {
        if (activeTab === 'pods') {
            loadPods().catch((error: any) => {
                showToast('error', error?.response?.data?.message || 'Failed to load pods');
            });
        }
    }, [activeTab, loadPods]);

    useEffect(() => {
        if (activeTab === 'services') {
            loadServices().catch((error: any) => {
                showToast('error', error?.response?.data?.message || 'Failed to load services');
            });
        }
    }, [activeTab, loadServices]);

    const handleRestart = async (workload: K8sWorkload) => {
        if (!confirm(`Restart ${workload.kind} ${workload.namespace}/${workload.name}?`)) return;
        try {
            const result = await K8sService.restartWorkload(
                workload.namespace,
                workload.kind as 'deployment' | 'statefulset' | 'daemonset',
                workload.name
            );
            showToast('success', result.message);
            await loadWorkloads();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Failed to restart workload');
        }
    };

    const handleScale = async (workload: K8sWorkload) => {
        const value = prompt(`Scale ${workload.kind} ${workload.namespace}/${workload.name} to replicas:`, String(workload.replicas));
        if (value === null) return;

        const replicas = Number.parseInt(value, 10);
        if (Number.isNaN(replicas)) {
            showToast('error', 'Replicas must be a number');
            return;
        }

        if (!confirm(`Scale to ${replicas} replicas?`)) return;

        try {
            const result = await K8sService.scaleWorkload(
                workload.namespace,
                workload.kind as 'deployment' | 'statefulset' | 'daemonset',
                workload.name,
                replicas
            );
            showToast('success', result.message);
            await loadWorkloads();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Failed to scale workload');
        }
    };

    const handleDeletePod = async (pod: K8sPod) => {
        if (!confirm(`Delete pod ${pod.namespace}/${pod.name}?`)) return;
        try {
            const result = await K8sService.deletePod(pod.namespace, pod.name);
            showToast('success', result.message);
            await loadPods();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Failed to delete pod');
        }
    };

    const handleApply = async (dryRun: boolean) => {
        if (!dryRun && !confirm('Apply manifest to cluster?')) return;

        try {
            const result = await K8sService.applyManifest({
                manifest,
                defaultNamespace: defaultNamespace || undefined,
                dryRun,
            });
            setApplyResult(result);
            showToast('success', dryRun ? 'Dry run completed' : 'Manifest apply completed');
            if (!dryRun) {
                if (activeTab === 'workloads') await loadWorkloads();
                if (activeTab === 'pods') await loadPods();
                if (activeTab === 'services') await loadServices();
            }
        } catch (error: any) {
            setApplyResult(null);
            showToast('error', error?.response?.data?.message || 'Apply failed');
        }
    };

    const closeLogStream = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setLogConnected(false);
    };

    const openLogStream = (pod: K8sPod, container?: string) => {
        closeLogStream();
        setLogPod(pod);
        setLogContainer(container || pod.containers[0] || '');
        setLogLines([]);
        setLogPaused(false);
        setLogAutoScroll(true);

        const ws = K8sService.createPodLogsWebSocket({
            namespace: pod.namespace,
            pod: pod.name,
            container: container || pod.containers[0],
            tailLines: logTailLines,
        });

        ws.onopen = () => setLogConnected(true);
        ws.onclose = () => setLogConnected(false);
        ws.onerror = () => setLogConnected(false);
        ws.onmessage = (event) => {
            const text = String(event.data || '');
            if (logPausedRef.current) return;
            setLogLines((prev) => [...prev, text].slice(-3000));
        };

        wsRef.current = ws;
    };

    useEffect(() => {
        return () => {
            closeLogStream();
        };
    }, []);

    useEffect(() => {
        logPausedRef.current = logPaused;
    }, [logPaused]);

    useEffect(() => {
        if (!logAutoScroll) {
            return;
        }
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logLines, logAutoScroll]);

    const reconnectLogStream = () => {
        if (!logPod) return;
        openLogStream(logPod, logContainer || undefined);
    };

    const downloadLogs = () => {
        const content = logLines.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `k8s-${logPod?.namespace || 'ns'}-${logPod?.name || 'pod'}-logs.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleTestConfig = async () => {
        try {
            const response: K8sActionResponse = await K8sService.testConfig(configPathInput);
            showToast('success', response.message + (response.serverVersion ? ` (${response.serverVersion})` : ''));
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Config test failed');
        }
    };

    const handleSaveConfig = async () => {
        try {
            const response = await K8sService.updateConfig(configPathInput);
            showToast('success', response.message);
            await loadOverview();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Failed to save config');
        }
    };

    const handleClearOverride = async () => {
        if (!confirm('Clear kubeconfig override and fallback to env/default path?')) return;
        try {
            const response = await K8sService.clearConfigOverride();
            showToast('success', response.message);
            await loadOverview();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Failed to clear override');
        }
    };

    const renderPagination = (
        page: number,
        pageSize: number,
        total: number,
        onPageChange: (next: number) => void
    ) => {
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        return (
            <div className="flex items-center justify-end gap-3 text-xs text-zinc-500 mt-3">
                <span>
                    Page {page} / {totalPages} ({total})
                </span>
                <ActionButton
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Prev
                </ActionButton>
                <ActionButton
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </ActionButton>
            </div>
        );
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Server },
        { id: 'workloads', label: 'Workloads', icon: Boxes },
        { id: 'pods', label: 'Pods', icon: Package2 },
        { id: 'services', label: 'Services', icon: Server },
        { id: 'apply', label: 'Apply YAML', icon: FileCode2 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Kubernetes (K3s)"
                icon={Server}
                description={
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        <span>
                            {status?.connected
                                ? `Connected · ${status.serverVersion || 'unknown'} · context ${status.context || '-'}`
                                : status?.message || 'Disconnected'}
                        </span>
                    </div>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <label>Namespace</label>
                            <select
                                value={namespaceFilter}
                                onChange={(e) => {
                                    setNamespaceFilter(e.target.value);
                                    setWorkloadPage(1);
                                    setPodPage(1);
                                    setServicePage(1);
                                }}
                                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
                            >
                                {namespaceOptions.map((ns) => (
                                    <option key={ns} value={ns}>
                                        {ns}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <ActionButton
                            variant="outline"
                            onClick={refreshActiveTab}
                            loading={loading}
                            icon={<RefreshCw size={16} />}
                        >
                            Refresh
                        </ActionButton>
                    </div>
                }
            />

            <Tabs items={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as K8sTab)} />

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-300">Cluster Status</h3>
                        <div className="text-sm text-zinc-400 space-y-1">
                            <p>Connected: {status?.connected ? 'Yes' : 'No'}</p>
                            <p>Version: {status?.serverVersion || '-'}</p>
                            <p>Context: {status?.context || '-'}</p>
                            <p>Source: {status?.kubeconfigSource || '-'}</p>
                            <p className="break-all">Kubeconfig: {status?.kubeconfigPath || '-'}</p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Nodes ({nodes.length})</h3>
                        <div className="space-y-2 max-h-72 overflow-auto">
                            {nodes.map((node) => (
                                <div key={node.name} className="bg-zinc-800/60 rounded p-3 text-xs text-zinc-300">
                                    <div className="font-medium text-sm">{node.name}</div>
                                    <div className="mt-1 text-zinc-500">
                                        {node.status} · {node.roles} · {node.version} · {node.internalIp} · {node.age}
                                    </div>
                                </div>
                            ))}
                            {nodes.length === 0 && <p className="text-zinc-500 text-sm">No nodes found</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'workloads' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                value={workloadSearch}
                                onChange={(e) => {
                                    setWorkloadSearch(e.target.value);
                                    setWorkloadPage(1);
                                }}
                                placeholder="Search workloads..."
                                className="w-full bg-zinc-800 border border-zinc-700 pl-9 pr-3 py-2 rounded text-sm text-zinc-200"
                            />
                        </div>
                        <select
                            value={workloadKind}
                            onChange={(e) => {
                                setWorkloadKind(e.target.value as typeof workloadKind);
                                setWorkloadPage(1);
                            }}
                            className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded text-sm text-zinc-200"
                        >
                            <option value="all">All kinds</option>
                            <option value="deployment">Deployment</option>
                            <option value="statefulset">StatefulSet</option>
                            <option value="daemonset">DaemonSet</option>
                        </select>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full text-sm min-w-[900px]">
                            <thead>
                                <tr className="text-zinc-500 border-b border-zinc-800">
                                    <th className="text-left py-2">Namespace</th>
                                    <th className="text-left py-2">Kind</th>
                                    <th className="text-left py-2">Name</th>
                                    <th className="text-left py-2">Ready</th>
                                    <th className="text-left py-2">Replicas</th>
                                    <th className="text-left py-2">Age</th>
                                    <th className="text-right py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workloads?.items.map((item) => (
                                    <tr key={`${item.namespace}-${item.kind}-${item.name}`} className="border-b border-zinc-800/50">
                                        <td className="py-2 text-zinc-400">{item.namespace}</td>
                                        <td className="py-2 text-zinc-400">{item.kind}</td>
                                        <td className="py-2 font-medium text-zinc-200">{item.name}</td>
                                        <td className="py-2 text-zinc-400">{item.ready}</td>
                                        <td className="py-2 text-zinc-400">{item.replicas}</td>
                                        <td className="py-2 text-zinc-400">{item.age}</td>
                                        <td className="py-2">
                                            <div className="flex justify-end gap-2">
                                                <ActionButton
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRestart(item)}
                                                    icon={<Play size={14} />}
                                                >
                                                    Restart
                                                </ActionButton>
                                                <ActionButton
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleScale(item)}
                                                    icon={<Scale size={14} />}
                                                >
                                                    Scale
                                                </ActionButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!workloads?.items.length && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                                            No workloads found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {workloads && renderPagination(workloads.page, workloads.pageSize, workloads.total, setWorkloadPage)}
                </div>
            )}

            {activeTab === 'pods' && (
                <div className="space-y-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                value={podSearch}
                                onChange={(e) => {
                                    setPodSearch(e.target.value);
                                    setPodPage(1);
                                }}
                                placeholder="Search pods..."
                                className="w-full bg-zinc-800 border border-zinc-700 pl-9 pr-3 py-2 rounded text-sm text-zinc-200"
                            />
                        </div>
                        <div className="overflow-auto">
                            <table className="w-full text-sm min-w-[980px]">
                                <thead>
                                    <tr className="text-zinc-500 border-b border-zinc-800">
                                        <th className="text-left py-2">Namespace</th>
                                        <th className="text-left py-2">Name</th>
                                        <th className="text-left py-2">Status</th>
                                        <th className="text-left py-2">Ready</th>
                                        <th className="text-left py-2">Restarts</th>
                                        <th className="text-left py-2">Node</th>
                                        <th className="text-left py-2">Age</th>
                                        <th className="text-right py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pods?.items.map((pod) => (
                                        <tr key={`${pod.namespace}-${pod.name}`} className="border-b border-zinc-800/50">
                                            <td className="py-2 text-zinc-400">{pod.namespace}</td>
                                            <td className="py-2 font-medium text-zinc-200">{pod.name}</td>
                                            <td className="py-2 text-zinc-400">{pod.status}</td>
                                            <td className="py-2 text-zinc-400">{pod.ready}</td>
                                            <td className="py-2 text-zinc-400">{pod.restarts}</td>
                                            <td className="py-2 text-zinc-400">{pod.node || '-'}</td>
                                            <td className="py-2 text-zinc-400">{pod.age}</td>
                                            <td className="py-2">
                                                <div className="flex justify-end gap-2">
                                                    <ActionButton
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openLogStream(pod)}
                                                        icon={<Terminal size={14} />}
                                                    >
                                                        Logs
                                                    </ActionButton>
                                                    <ActionButton
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={() => handleDeletePod(pod)}
                                                        icon={<Trash2 size={14} />}
                                                    >
                                                        Delete
                                                    </ActionButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!pods?.items.length && (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-zinc-500">
                                                No pods found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pods && renderPagination(pods.page, pods.pageSize, pods.total, setPodPage)}
                    </div>

                    {logPod && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-zinc-200">
                                        Logs: {logPod.namespace}/{logPod.name}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {logConnected ? 'Streaming' : 'Disconnected'} · {logLines.length} lines
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={logContainer}
                                        onChange={(e) => {
                                            const next = e.target.value;
                                            setLogContainer(next);
                                            if (logPod) {
                                                openLogStream(logPod, next);
                                            }
                                        }}
                                        className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded text-xs text-zinc-300"
                                    >
                                        {(logPod.containers || []).map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min={1}
                                        max={5000}
                                        value={logTailLines}
                                        onChange={(e) => setLogTailLines(Math.max(1, Number(e.target.value || 200)))}
                                        className="w-24 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded text-xs text-zinc-300"
                                        title="Tail lines"
                                    />
                                    <ActionButton
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setLogPaused((v) => !v)}
                                        icon={logPaused ? <Play size={14} /> : <Pause size={14} />}
                                    >
                                        {logPaused ? 'Resume' : 'Pause'}
                                    </ActionButton>
                                    <ActionButton
                                        size="sm"
                                        variant={logAutoScroll ? 'primary' : 'outline'}
                                        onClick={() => setLogAutoScroll((v) => !v)}
                                    >
                                        Auto-scroll
                                    </ActionButton>
                                    <ActionButton
                                        size="sm"
                                        variant="outline"
                                        onClick={reconnectLogStream}
                                        icon={<RefreshCw size={14} />}
                                    >
                                        Reconnect
                                    </ActionButton>
                                    <ActionButton
                                        size="sm"
                                        variant="outline"
                                        onClick={downloadLogs}
                                        icon={<Download size={14} />}
                                    >
                                        Download
                                    </ActionButton>
                                    <ActionButton
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            closeLogStream();
                                            setLogPod(null);
                                            setLogLines([]);
                                        }}
                                        icon={<X size={14} />}
                                    >
                                        Close
                                    </ActionButton>
                                </div>
                            </div>
                            <div
                                ref={logContainerRef}
                                className="h-72 overflow-auto p-3 bg-black/60 text-xs font-mono text-zinc-200 whitespace-pre-wrap"
                            >
                                {logLines.join('\n') || 'No logs received yet.'}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'services' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            value={serviceSearch}
                            onChange={(e) => {
                                setServiceSearch(e.target.value);
                                setServicePage(1);
                            }}
                            placeholder="Search services..."
                            className="w-full bg-zinc-800 border border-zinc-700 pl-9 pr-3 py-2 rounded text-sm text-zinc-200"
                        />
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-sm min-w-[900px]">
                            <thead>
                                <tr className="text-zinc-500 border-b border-zinc-800">
                                    <th className="text-left py-2">Namespace</th>
                                    <th className="text-left py-2">Name</th>
                                    <th className="text-left py-2">Type</th>
                                    <th className="text-left py-2">Cluster IP</th>
                                    <th className="text-left py-2">External IP</th>
                                    <th className="text-left py-2">Ports</th>
                                    <th className="text-left py-2">Age</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services?.items.map((svc) => (
                                    <tr key={`${svc.namespace}-${svc.name}`} className="border-b border-zinc-800/50">
                                        <td className="py-2 text-zinc-400">{svc.namespace}</td>
                                        <td className="py-2 font-medium text-zinc-200">{svc.name}</td>
                                        <td className="py-2 text-zinc-400">{svc.type}</td>
                                        <td className="py-2 text-zinc-400">{svc.clusterIp || '-'}</td>
                                        <td className="py-2 text-zinc-400">{svc.externalIp || '-'}</td>
                                        <td className="py-2 text-zinc-400">{svc.ports || '-'}</td>
                                        <td className="py-2 text-zinc-400">{svc.age}</td>
                                    </tr>
                                ))}
                                {!services?.items.length && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                                            No services found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {services && renderPagination(services.page, services.pageSize, services.total, setServicePage)}
                </div>
            )}

            {activeTab === 'apply' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <div className="flex-1">
                            <label className="block text-xs text-zinc-500 mb-1">Default Namespace</label>
                            <input
                                value={defaultNamespace}
                                onChange={(e) => setDefaultNamespace(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
                                placeholder="default"
                            />
                        </div>
                        <div className="flex gap-2">
                            <ActionButton variant="outline" onClick={() => handleApply(true)} icon={<Play size={16} />}>
                                Dry Run
                            </ActionButton>
                            <ActionButton variant="primary" onClick={() => handleApply(false)} icon={<FileCode2 size={16} />}>
                                Apply
                            </ActionButton>
                        </div>
                    </div>

                    <CodeEditor
                        language="yaml"
                        value={manifest}
                        onChange={setManifest}
                        height="380px"
                    />

                    {applyResult && (
                        <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 space-y-2">
                            <div className="text-sm font-medium text-zinc-200">
                                {applyResult.dryRun ? 'Dry Run Result' : 'Apply Result'} · {applyResult.success ? 'Success' : 'Failed'}
                            </div>
                            {applyResult.results.map((r, idx) => (
                                <div key={idx} className="text-xs text-zinc-400">
                                    <span className={`font-medium ${r.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        [{r.status.toUpperCase()}]
                                    </span>{' '}
                                    {r.kind} {r.namespace}/{r.name} · {r.action} · {r.message}
                                </div>
                            ))}
                            {applyResult.warnings?.length > 0 && (
                                <div className="text-xs text-amber-400">
                                    {applyResult.warnings.join(' | ')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
                    <div className="text-sm text-zinc-300 font-medium">Kubeconfig Settings</div>
                    <div className="space-y-2 text-xs text-zinc-500">
                        <p>Effective Path: {config?.effectivePath || '-'}</p>
                        <p>Source: {config?.source || '-'}</p>
                        <p>Override Path: {config?.overridePath || '-'}</p>
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Kubeconfig Path Override</label>
                        <input
                            value={configPathInput}
                            onChange={(e) => setConfigPathInput(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200"
                            placeholder="/home/hashi/.kube/config"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ActionButton variant="outline" onClick={handleTestConfig} icon={<Terminal size={16} />}>
                            Test Path
                        </ActionButton>
                        <ActionButton variant="primary" onClick={handleSaveConfig} icon={<Settings size={16} />}>
                            Save Override
                        </ActionButton>
                        <ActionButton variant="warning" onClick={handleClearOverride} icon={<X size={16} />}>
                            Reset Override
                        </ActionButton>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default K8sManager;
