/**
 * System and dashboard related types
 */

/** Disk storage information */
export interface DiskInfo {
    name: string;
    mount: string;
    totalSpace: number;
    usedSpace: number;
    usableSpace: number;
}

/** Network statistics */
export interface NetworkInfo {
    uploadRate: number;
    downloadRate: number;
    totalSent: number;
    totalRecv: number;
}

/** System status from dashboard API */
export interface SystemStatus {
    cpuUsage: number;
    coreCount: number;
    totalMemory: number;
    usedMemory: number;
    memoryUsage: number;
    osName: string;
    systemLoad: number;
    disks: DiskInfo[];
    network: NetworkInfo;
}

/** System statistics summary */
export interface SystemStats {
    cpu: number;
    memory: number;
    disk: number;
    networkIn: number;
    networkOut: number;
    loadAverage: [number, number, number];
}

/** Systemd service information */
export interface ServiceItem {
    name: string;
    description: string;
    loadState: string;
    activeState: string;
    subState: string;
}

/** System service with status */
export interface SystemService {
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'failed';
    subState: 'running' | 'dead' | 'exited';
    autoStart: boolean;
}
