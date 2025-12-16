/**
 * Frontend API Services
 * Organized by feature domain
 */

import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
    AddIptablesRuleRequest,
    AuthResponse,
    CreateFtpUserRequest,
    CreateGroupOptions,
    CreateUserOptions,
    CreateNginxHostRequest,
    CreateVmRequest,
    CronJob,
    DockerImage,
    DockerNetwork,
    DockerVolume,
    FileItem,
    FirewallRule,
    FtpServerInfo,
    FtpUser,
    GroupInfo,
    IptablesRule,
    IsoFile,
    PasswordInfo,
    ServiceItem,
    SystemStatus,
    UpdateFtpUserRequest,
    UpdateInfo,
    UpdateVmRequest,
    UserInfo,
    VM,
    VncInfo,
    PackageInfo,
    SystemDisk,
    NetworkInterface,
} from '@/types';

// ==================== Core Configuration ====================

/** API base URL (via Vite proxy) */
export const API_BASE_URL = '/api/v1';

/** Axios instance with default configuration */
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ==================== WebSocket ====================

/** Connect to WebSocket for real-time system status updates */
export const connectWebSocket = (onMessageReceived: (status: SystemStatus) => void) => {
    const client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        onConnect: () => {
            console.log('Connected to WebSocket');
            client.subscribe('/topic/status', (message) => {
                if (message.body) {
                    const status: SystemStatus = JSON.parse(message.body);
                    onMessageReceived(status);
                }
            });
        },
        onStompError: (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        },
    });
    client.activate();
    return client;
};

// ==================== Session Storage ====================

const USER_STORAGE_KEY = 'hashi_user';

/** Browser session storage for user data */
export const SessionStorage = {
    getUser: (): UserInfo | null => {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return null;
            }
        }
        return null;
    },
    setUser: (user: UserInfo): void => {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    },
    clearUser: (): void => {
        localStorage.removeItem(USER_STORAGE_KEY);
    },
};

// ==================== Authentication ====================

/** Authentication API */
export const AuthService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', { username, password });
        return response.data;
    },
    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
    },
    validateSession: async (username: string): Promise<AuthResponse> => {
        const response = await api.get<AuthResponse>('/auth/validate', { params: { username } });
        return response.data;
    },
};

// ==================== User Management ====================

/** User and group management API */
export const UserManagementService = {
    // User queries
    listUsers: async (): Promise<UserInfo[]> => {
        const response = await api.get<UserInfo[]>('/users');
        return response.data;
    },
    getUser: async (username: string): Promise<UserInfo> => {
        const response = await api.get<UserInfo>(`/users/${username}`);
        return response.data;
    },
    getPasswordInfo: async (username: string): Promise<PasswordInfo> => {
        const response = await api.get<PasswordInfo>(`/users/${username}/password-info`);
        return response.data;
    },
    getAvailableShells: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/users/shells');
        return response.data;
    },

    // User management
    createUser: async (options: CreateUserOptions) => {
        const response = await api.post('/users', options);
        return response.data;
    },
    deleteUser: async (username: string, removeHome: boolean = false, force: boolean = false) => {
        const response = await api.delete(`/users/${username}`, { params: { removeHome, force } });
        return response.data;
    },
    renameUser: async (username: string, newUsername: string) => {
        const response = await api.put(`/users/${username}/rename`, { newUsername });
        return response.data;
    },
    changeUid: async (username: string, uid: number) => {
        const response = await api.put(`/users/${username}/uid`, { uid });
        return response.data;
    },
    changePrimaryGroup: async (username: string, gid: number) => {
        const response = await api.put(`/users/${username}/primary-group`, { gid });
        return response.data;
    },
    changeHomeDir: async (username: string, homeDir: string, moveContents: boolean = false) => {
        const response = await api.put(`/users/${username}/home`, { homeDir, moveContents });
        return response.data;
    },
    changeShell: async (username: string, shell: string) => {
        const response = await api.put(`/users/${username}/shell`, { shell });
        return response.data;
    },
    changeGecos: async (username: string, gecos: string) => {
        const response = await api.put(`/users/${username}/gecos`, { gecos });
        return response.data;
    },

    // Password management
    changePassword: async (username: string, password: string) => {
        const response = await api.put(`/users/${username}/password`, { password });
        return response.data;
    },
    deletePassword: async (username: string) => {
        const response = await api.delete(`/users/${username}/password`);
        return response.data;
    },
    expirePassword: async (username: string) => {
        const response = await api.post(`/users/${username}/expire-password`);
        return response.data;
    },
    setPasswordPolicy: async (
        username: string,
        policy: { minDays?: number; maxDays?: number; warnDays?: number; inactiveDays?: number }
    ) => {
        const response = await api.put(`/users/${username}/password-policy`, policy);
        return response.data;
    },

    // Account locking
    lockUser: async (username: string) => {
        const response = await api.post(`/users/${username}/lock`);
        return response.data;
    },
    unlockUser: async (username: string) => {
        const response = await api.post(`/users/${username}/unlock`);
        return response.data;
    },
    setExpireDate: async (username: string, expireDate: string | null) => {
        const response = await api.put(`/users/${username}/expire-date`, { expireDate });
        return response.data;
    },

    // Group queries
    listGroups: async (): Promise<GroupInfo[]> => {
        const response = await api.get<GroupInfo[]>('/users/groups');
        return response.data;
    },
    getGroup: async (groupName: string): Promise<GroupInfo> => {
        const response = await api.get<GroupInfo>(`/users/groups/${groupName}`);
        return response.data;
    },
    getUserGroups: async (username: string): Promise<string[]> => {
        const response = await api.get<string[]>(`/users/${username}/groups`);
        return response.data;
    },

    // Group member management
    setUserGroups: async (username: string, groups: string[]) => {
        const response = await api.put(`/users/${username}/groups`, { groups });
        return response.data;
    },
    addUserToGroups: async (username: string, groups: string[]) => {
        const response = await api.post(`/users/${username}/groups`, { groups });
        return response.data;
    },

    // Group management
    createGroup: async (options: CreateGroupOptions) => {
        const response = await api.post('/users/groups', options);
        return response.data;
    },
    deleteGroup: async (groupName: string, force: boolean = false) => {
        const response = await api.delete(`/users/groups/${groupName}`, { params: { force } });
        return response.data;
    },
    renameGroup: async (groupName: string, newName: string) => {
        const response = await api.put(`/users/groups/${groupName}/rename`, { newName });
        return response.data;
    },
    changeGroupGid: async (groupName: string, gid: number) => {
        const response = await api.put(`/users/groups/${groupName}/gid`, { gid });
        return response.data;
    },
    setGroupMembers: async (groupName: string, members: string[]) => {
        const response = await api.put(`/users/groups/${groupName}/members`, { members });
        return response.data;
    },
    addMemberToGroup: async (groupName: string, username: string) => {
        const response = await api.post(`/users/groups/${groupName}/members`, { username });
        return response.data;
    },
    removeMemberFromGroup: async (groupName: string, username: string) => {
        const response = await api.delete(`/users/groups/${groupName}/members/${username}`);
        return response.data;
    },
    setGroupAdmins: async (groupName: string, admins: string[]) => {
        const response = await api.put(`/users/groups/${groupName}/admins`, { admins });
        return response.data;
    },
};

// ==================== Virtualization (KVM) ====================

/** VM and ISO management API */
export const VirtService = {
    // VM management
    listVms: async () => {
        const response = await api.get<VM[]>('/virt/vms');
        return response.data;
    },
    getVmDetails: async (name: string) => {
        const response = await api.get<VM>(`/virt/vms/${name}`);
        return response.data;
    },
    createVm: async (request: CreateVmRequest) => {
        const response = await api.post<VM>('/virt/vms', request);
        return response.data;
    },
    updateVm: async (name: string, request: UpdateVmRequest) => {
        const response = await api.put<VM>(`/virt/vms/${name}`, request);
        return response.data;
    },
    deleteVm: async (name: string) => {
        await api.delete(`/virt/vms/${name}`);
    },
    controlVm: async (name: string, action: 'start' | 'stop' | 'force-stop' | 'reboot') => {
        await api.post(`/virt/vms/${name}/${action}`);
    },
    getVncInfo: async (name: string) => {
        const response = await api.get<VncInfo>(`/virt/vms/${name}/vnc-info`);
        return response.data;
    },

    // ISO management
    listIsoFiles: async () => {
        const response = await api.get<IsoFile[]>('/virt/iso');
        return response.data;
    },
    uploadIso: async (file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<IsoFile>('/virt/iso', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 0,
            onUploadProgress: (event) => {
                if (onProgress) {
                    const total = event.total || file.size;
                    const progress = Math.round((event.loaded * 100) / total);
                    onProgress(Math.min(progress, 99));
                }
            },
        });
        if (onProgress) onProgress(100);
        return response.data;
    },
    deleteIso: async (filename: string) => {
        await api.delete(`/virt/iso/${filename}`);
    },
};

// ==================== Firewall ====================

/** UFW firewall management API */
export const FirewallService = {
    getStatus: async () => {
        const response = await api.get<{ enabled: boolean }>('/firewall/status');
        return response.data.enabled;
    },
    setStatus: async (enabled: boolean) => {
        await api.post('/firewall/status', null, { params: { enabled } });
    },
    getRules: async () => {
        const response = await api.get<FirewallRule[]>('/firewall');
        return response.data;
    },
    addRule: async (port: string, protocol: string) => {
        await api.post(`/firewall/allow`, null, { params: { port, protocol } });
    },
    deleteRule: async (index: number) => {
        await api.delete(`/firewall/${index}`);
    },
};

/** iptables management API */
export const IptablesService = {
    getRules: async (table: string = 'filter') => {
        const response = await api.get<IptablesRule[]>('/iptables', { params: { table } });
        return response.data;
    },
    addRule: async (rule: AddIptablesRuleRequest) => {
        await api.post('/iptables', rule);
    },
    deleteRule: async (table: string, chain: string, lineNumber: number) => {
        await api.delete(`/iptables/${table}/${chain}/${lineNumber}`);
    },
    saveRules: async () => {
        await api.post('/iptables/save');
    },
};

// ==================== FTP ====================

/** FTP server management API */
export const FtpService = {
    detectServers: async () => {
        const response = await api.get<FtpServerInfo[]>('/ftp/servers');
        return response.data;
    },
    getStatus: async (type: string) => {
        const response = await api.get<FtpServerInfo>(`/ftp/${type}/status`);
        return response.data;
    },
    setEnabled: async (type: string, enabled: boolean) => {
        await api.post(`/ftp/${type}/status`, null, { params: { enabled } });
    },
    getConfig: async (type: string) => {
        const response = await api.get<{ content: string }>(`/ftp/${type}/config`);
        return response.data.content;
    },
    updateConfig: async (type: string, content: string) => {
        await api.put(`/ftp/${type}/config`, { content });
    },
    listUsers: async (type: string) => {
        const response = await api.get<FtpUser[]>(`/ftp/${type}/users`);
        return response.data;
    },
    addUser: async (type: string, user: CreateFtpUserRequest) => {
        await api.post(`/ftp/${type}/users`, user);
    },
    updateUser: async (type: string, username: string, data: UpdateFtpUserRequest) => {
        await api.put(`/ftp/${type}/users/${username}`, data);
    },
    deleteUser: async (type: string, username: string) => {
        await api.delete(`/ftp/${type}/users/${username}`);
    },
    getLogs: async (type: string, lines: number = 100) => {
        const response = await api.get<string[]>(`/ftp/${type}/logs`, { params: { lines } });
        return response.data;
    },
};

// ==================== Cron ====================

/** Cron job management API */
export const CronService = {
    listJobs: async () => {
        const response = await api.get<CronJob[]>('/cron');
        return response.data;
    },
    saveJobs: async (jobs: CronJob[]) => {
        await api.post('/cron', jobs);
    },
};

// ==================== Systemd Services ====================

/** Systemd service management API */
export const SystemdService = {
    listServices: async () => {
        const response = await api.get<ServiceItem[]>('/services');
        return response.data;
    },
    controlService: async (name: string, action: 'start' | 'stop' | 'restart') => {
        await api.post(`/services/${name}/${action}`);
    },
};

// ==================== File Manager ====================

/** File system management API */
export const FileService = {
    listFiles: async (path: string = '/') => {
        const response = await api.get<FileItem[]>('/files/list', { params: { path } });
        return response.data;
    },
    getFileContent: async (path: string) => {
        const response = await api.get<string>('/files/content', {
            params: { path },
            responseType: 'text',
        });
        return response.data;
    },
    saveFileContent: async (path: string, content: string) => {
        await api.post('/files/content', { path, content });
    },
    deleteFile: async (path: string) => {
        await api.delete('/files/delete', { params: { path } });
    },
};

// ==================== Docker ====================

/** Docker container management API */
export const DockerService = {
    getContainers: async () => {
        const response = await api.get('/docker/containers');
        return response.data;
    },
    startContainer: async (id: string) => {
        return api.post(`/docker/containers/${id}/start`);
    },
    stopContainer: async (id: string) => {
        return api.post(`/docker/containers/${id}/stop`);
    },
    restartContainer: async (id: string) => {
        return api.post(`/docker/containers/${id}/restart`);
    },

    // Images
    listImages: async () => {
        const response = await api.get<DockerImage[]>('/docker/images');
        return response.data;
    },
    pullImage: async (repository: string, tag: string) => {
        await api.post('/docker/images/pull', null, { params: { repository, tag } });
    },
    removeImage: async (id: string) => {
        await api.delete(`/docker/images/${id}`);
    },

    // Networks
    listNetworks: async () => {
        const response = await api.get<DockerNetwork[]>('/docker/networks');
        return response.data;
    },
    createNetwork: async (name: string, driver: string) => {
        await api.post('/docker/networks', null, { params: { name, driver } });
    },
    removeNetwork: async (id: string) => {
        await api.delete(`/docker/networks/${id}`);
    },

    // Volumes
    listVolumes: async () => {
        const response = await api.get<DockerVolume[]>('/docker/volumes');
        return response.data;
    },
    createVolume: async (name: string) => {
        await api.post('/docker/volumes', null, { params: { name } });
    },
    removeVolume: async (name: string) => {
        await api.delete(`/docker/volumes/${name}`);
    },
};

// ==================== Dashboard ====================

/** System monitoring API */
export const DashboardService = {
    getSystemStatus: async () => {
        const response = await api.get('/dashboard/status');
        return response.data;
    },
};

// ==================== Nginx ====================

/** Nginx web server management API */
export const NginxApiService = {
    // Service control
    getStatus: async () => {
        const response = await api.get('/nginx/status');
        return response.data;
    },
    reload: async () => {
        const response = await api.post('/nginx/reload');
        return response.data;
    },
    testConfig: async () => {
        const response = await api.post('/nginx/test');
        return response.data;
    },

    // Virtual Host management
    listHosts: async () => {
        const response = await api.get('/nginx/hosts');
        return response.data;
    },
    getHost: async (name: string) => {
        const response = await api.get(`/nginx/hosts/${name}`);
        return response.data;
    },
    getHostConfig: async (name: string) => {
        const response = await api.get(`/nginx/hosts/${name}/config`, { responseType: 'text' });
        return response.data;
    },
    createHost: async (request: CreateNginxHostRequest) => {
        const response = await api.post('/nginx/hosts', request);
        return response.data;
    },
    updateHostConfig: async (name: string, content: string) => {
        const response = await api.put(`/nginx/hosts/${name}/config`, { content });
        return response.data;
    },
    deleteHost: async (name: string) => {
        const response = await api.delete(`/nginx/hosts/${name}`);
        return response.data;
    },
    enableHost: async (name: string) => {
        const response = await api.post(`/nginx/hosts/${name}/enable`);
        return response.data;
    },
    disableHost: async (name: string) => {
        const response = await api.post(`/nginx/hosts/${name}/disable`);
        return response.data;
    },

    // SSL certificate management
    listCertificates: async () => {
        const response = await api.get('/nginx/ssl');
        return response.data;
    },
    requestCertbotCert: async (domain: string, email: string) => {
        const response = await api.post('/nginx/ssl/certbot', { domain, email });
        return response.data;
    },
    requestAcmeCert: async (domain: string, email: string) => {
        const response = await api.post('/nginx/ssl/acme', { domain, email });
        return response.data;
    },
};

// ==================== Update Service ====================

/** Application update checking API */
export const UpdateService = {
    /** Get cached update information */
    getUpdateInfo: async (): Promise<UpdateInfo> => {
        const response = await api.get<UpdateInfo>('/update/info');
        return response.data;
    },
    /** Force check for updates (bypass cache) */
    checkForUpdates: async (): Promise<UpdateInfo> => {
        const response = await api.post<UpdateInfo>('/update/check');
        return response.data;
    },
};

// ==================== Package Service ====================

/** System package management API */
export const PackageService = {
    search: async (query: string): Promise<PackageInfo[]> => {
        const response = await api.get<PackageInfo[]>('/packages/search', { params: { q: query } });
        return response.data;
    },
    listUpdates: async (): Promise<PackageInfo[]> => {
        const response = await api.get<PackageInfo[]>('/packages/updates');
        return response.data;
    },
    install: async (name: string) => {
        const response = await api.post('/packages/install', null, { params: { name } });
        return response.data;
    },
    remove: async (name: string) => {
        const response = await api.post('/packages/remove', null, { params: { name } });
        return response.data;
    },
    upgrade: async (name: string) => {
        const response = await api.post('/packages/upgrade', null, { params: { name } });
        return response.data;
    },
    updateCache: async () => {
        const response = await api.post('/packages/cache/update');
        return response.data;
    },
};

// ==================== Disk Service ====================

/** System disk and partition management API */
export const DiskService = {
    list: async (): Promise<SystemDisk[]> => {
        const response = await api.get<SystemDisk[]>('/disks');
        return response.data;
    },
    mount: async (source: string, target: string, fstype?: string, options?: string) => {
        const response = await api.post('/disks/mount', { source, target, fstype, options });
        return response.data;
    },
    unmount: async (target: string) => {
        const response = await api.post('/disks/unmount', { target });
        return response.data;
    },
    format: async (device: string, fstype: string, label: string) => {
        const response = await api.post('/disks/format', {
            device,
            fstype,
            label,
            confirmation: 'FORMAT',
        });
        return response.data;
    },
    createPartition: async (disk: string, fstype: string, start: string, end: string) => {
        const response = await api.post('/disks/partition/create', { disk, fstype, start, end });
        return response.data;
    },
    deletePartition: async (disk: string, partition: number) => {
        const response = await api.post('/disks/partition/delete', { disk, partition });
        return response.data;
    },
    resizePartition: async (disk: string, partition: number, end: string) => {
        const response = await api.post('/disks/partition/resize', { disk, partition, end });
        return response.data;
    },
};

// ==================== Network Service ====================

/** Network interface management API */
export const NetworkService = {
    listInterfaces: async (): Promise<NetworkInterface[]> => {
        const response = await api.get<NetworkInterface[]>('/network/interfaces');
        return response.data;
    },
    getDns: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/network/dns');
        return response.data;
    },
    updateDns: async (nameservers: string[]) => {
        await api.post('/network/dns', nameservers);
    },
    configureInterface: async (name: string, config: { ipv4Method: string; ipAddress?: string; gateway?: string }) => {
        await api.post(`/network/interfaces/${name}/config`, config);
    },
    setInterfaceState: async (name: string, state: 'up' | 'down') => {
        await api.post(`/network/interfaces/${name}/state`, null, { params: { state } });
    },
};
