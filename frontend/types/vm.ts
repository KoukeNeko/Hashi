/**
 * VM and virtualization related types
 */

/** Disk configuration for VM storage */
export interface Disk {
    name?: string;
    sizeGB?: number;
    path?: string;
    format?: string;
    bus?: string;
    cache?: string;
    io?: string;
    bootable?: boolean;
}

/** Virtual Machine information */
export interface VM {
    id: number;
    uuid: string;
    name: string;
    state: string;
    vcpu: number;
    memory: number;
    maxMemory?: number;
    description?: string;
    cpuMode?: string;
    cpuSockets?: number;
    cpuCores?: number;
    cpuThreads?: number;
    hugepages?: boolean;
    diskPath?: string;
    diskFormat?: string;
    diskBus?: string;
    diskSizeBytes?: number;
    disks?: Disk[];
    networkType?: string;
    networkSource?: string;
    networkModel?: string;
    macAddress?: string;
    graphicsType?: string;
    graphicsPort?: number;
    graphicsListen?: string;
    videoModel?: string;
    videoVram?: number;
    bootOrder?: string[];
    bootMenu?: boolean;
    uefi?: boolean;
    osType?: string;
    machine?: string;
    onPoweroff?: string;
    onReboot?: string;
    onCrash?: string;
    acpi?: boolean;
    apic?: boolean;
    autostart?: boolean;
    clockOffset?: string;
    isoPath?: string;
    usb?: boolean;
    tablet?: boolean;
    serial?: boolean;
    tpm?: boolean;
}

/** Request to update VM configuration */
export interface UpdateVmRequest {
    vcpu?: number;
    cpuMode?: string;
    cpuSockets?: number;
    cpuCores?: number;
    cpuThreads?: number;
    memoryMB?: number;
    maxMemoryMB?: number;
    hugepages?: boolean;
    description?: string;
    networkType?: string;
    networkSource?: string;
    networkModel?: string;
    macAddress?: string;
    graphicsType?: string;
    graphicsPort?: number;
    graphicsListen?: string;
    graphicsPassword?: string;
    videoModel?: string;
    videoVram?: number;
    bootOrder?: string[];
    bootMenu?: boolean;
    onPoweroff?: string;
    onReboot?: string;
    onCrash?: string;
    acpi?: boolean;
    apic?: boolean;
    autostart?: boolean;
    clockOffset?: string;
    isoPath?: string | null;
    usb?: boolean;
    tablet?: boolean;
    serial?: boolean;
    tpm?: boolean;
}

/** Request to create a new VM */
export interface CreateVmRequest {
    name: string;
    description?: string;
    vcpu: number;
    cpuMode?: string;
    cpuSockets?: number;
    cpuCores?: number;
    cpuThreads?: number;
    memoryMB: number;
    maxMemoryMB?: number;
    hugepages?: boolean;
    diskGB?: number;
    diskFormat?: string;
    diskBus?: string;
    diskCache?: string;
    diskIo?: string;
    disks?: Disk[];
    networkType?: string;
    networkSource?: string;
    networkModel?: string;
    macAddress?: string;
    graphicsType?: string;
    graphicsPort?: number;
    graphicsListen?: string;
    graphicsPassword?: string;
    videoModel?: string;
    videoVram?: number;
    bootOrder?: string[];
    bootMenu?: boolean;
    uefi?: boolean;
    secureBoot?: boolean;
    isoPath?: string;
    osType: string;
    osVariant?: string;
    machine?: string;
    arch?: string;
    onPoweroff?: string;
    onReboot?: string;
    onCrash?: string;
    acpi?: boolean;
    apic?: boolean;
    autostart?: boolean;
    clockOffset?: string;
    usb?: boolean;
    tablet?: boolean;
    serial?: boolean;
    tpm?: boolean;
}

/** Default values for VM creation */
export const VM_DEFAULTS = {
    cpuMode: 'host-passthrough',
    diskFormat: 'qcow2',
    diskBus: 'virtio',
    diskCache: 'none',
    diskIo: 'native',
    networkType: 'network',
    networkSource: 'default',
    networkModel: 'virtio',
    graphicsType: 'vnc',
    graphicsPort: -1,
    graphicsListen: '0.0.0.0',
    videoModel: 'qxl',
    videoVram: 65536,
    bootOrder: ['cdrom', 'hd'],
    machine: 'q35',
    arch: 'x86_64',
    onPoweroff: 'destroy',
    onReboot: 'restart',
    onCrash: 'destroy',
    clockOffset: 'utc',
    acpi: true,
    apic: true,
    autostart: false,
    usb: true,
    tablet: true,
    serial: true,
    tpm: false,
    uefi: false,
    secureBoot: false,
    bootMenu: false,
    hugepages: false,
};

/** VM configuration options */
export const VM_OPTIONS = {
    cpuModes: [
        { value: 'host-passthrough', label: 'Host Passthrough (最佳效能)' },
        { value: 'host-model', label: 'Host Model (相容性佳)' },
        { value: 'custom', label: 'Custom' },
    ],
    diskFormats: [
        { value: 'qcow2', label: 'QCOW2 (推薦，支援快照)' },
        { value: 'raw', label: 'RAW (最佳效能)' },
    ],
    diskBuses: [
        { value: 'virtio', label: 'VirtIO (最佳效能)' },
        { value: 'sata', label: 'SATA' },
        { value: 'scsi', label: 'SCSI' },
        { value: 'ide', label: 'IDE (舊系統相容)' },
    ],
    diskCaches: [
        { value: 'none', label: 'None (直接 I/O)' },
        { value: 'writeback', label: 'Writeback (效能較好)' },
        { value: 'writethrough', label: 'Writethrough (安全)' },
    ],
    diskIos: [
        { value: 'native', label: 'Native' },
        { value: 'threads', label: 'Threads' },
    ],
    networkTypes: [
        { value: 'network', label: 'NAT 網路' },
        { value: 'bridge', label: '橋接網路' },
    ],
    networkModels: [
        { value: 'virtio', label: 'VirtIO (最佳效能)' },
        { value: 'e1000', label: 'Intel E1000' },
        { value: 'rtl8139', label: 'Realtek RTL8139' },
    ],
    graphicsTypes: [
        { value: 'vnc', label: 'VNC' },
        { value: 'spice', label: 'SPICE' },
    ],
    videoModels: [
        { value: 'qxl', label: 'QXL (SPICE 最佳化)' },
        { value: 'virtio', label: 'VirtIO GPU' },
        { value: 'vga', label: 'VGA' },
        { value: 'cirrus', label: 'Cirrus' },
    ],
    machines: [
        { value: 'q35', label: 'Q35 (現代，支援 PCIe)' },
        { value: 'pc', label: 'i440FX (傳統，相容性佳)' },
    ],
    osTypes: [
        { value: 'linux', label: 'Linux' },
        { value: 'windows', label: 'Windows' },
    ],
    powerActions: [
        { value: 'destroy', label: '強制關閉' },
        { value: 'restart', label: '重新啟動' },
        { value: 'preserve', label: '保留狀態' },
    ],
    clockOffsets: [
        { value: 'utc', label: 'UTC (Linux 推薦)' },
        { value: 'localtime', label: '本地時間 (Windows 推薦)' },
    ],
    bootDevices: [
        { value: 'hd', label: '硬碟' },
        { value: 'cdrom', label: 'CD-ROM' },
        { value: 'network', label: '網路開機 (PXE)' },
    ],
};

/** ISO file information */
export interface IsoFile {
    name: string;
    path: string;
    size: number;
}

/** VNC connection information */
export interface VncInfo {
    host: string;
    port: number;
    websocketUrl: string;
    password?: string;
}

/** VM status enum */
export enum VmStatus {
    RUNNING = 'running',
    SHUTOFF = 'shutoff',
    PAUSED = 'paused',
    PROVISIONING = 'provisioning'
}

/** Legacy VM interface */
export interface VirtualMachine {
    id: string;
    name: string;
    os: string;
    status: VmStatus;
    vcpu: number;
    memory: number;
    disk: number;
    ip: string;
}
