export interface Disk {
  name?: string;           // 磁碟名稱 (e.g. "data", "backup")
  sizeGB?: number;         // 磁碟大小 (GB) - 新建磁碟時使用
  path?: string;           // 磁碟路徑 - 現有磁碟時使用
  format?: string;         // 磁碟格式 (qcow2/raw)
  bus?: string;            // 匯流排類型 (virtio/sata/scsi/ide)
  cache?: string;          // 快取模式 (none/writeback/writethrough)
  io?: string;             // I/O 模式 (native/threads)
  bootable?: boolean;      // 是否為開機磁碟
}

export interface VM {
  id: number;
  uuid: string;
  name: string;
  state: string; // VIR_DOMAIN_RUNNING, VIR_DOMAIN_SHUTOFF
  vcpu: number;
  memory: number;
  maxMemory?: number;

  // 詳細設定 (由 getVmDetails 填充)
  description?: string;
  cpuMode?: string;
  cpuSockets?: number;
  cpuCores?: number;
  cpuThreads?: number;
  hugepages?: boolean;

  // 主磁碟 (向後相容)
  diskPath?: string;
  diskFormat?: string;
  diskBus?: string;
  diskSizeBytes?: number;

  // 多磁碟
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

export interface UpdateVmRequest {
  // CPU 設定 (需要 VM 關機)
  vcpu?: number;
  cpuMode?: string;
  cpuSockets?: number;
  cpuCores?: number;
  cpuThreads?: number;

  // 記憶體設定 (部分可熱插拔)
  memoryMB?: number;
  maxMemoryMB?: number;
  hugepages?: boolean;

  // 描述 (可隨時修改)
  description?: string;

  // 網路設定 (需要 VM 關機)
  networkType?: string;
  networkSource?: string;
  networkModel?: string;
  macAddress?: string;

  // 顯示設定 (需要 VM 關機)
  graphicsType?: string;
  graphicsPort?: number;
  graphicsListen?: string;
  graphicsPassword?: string;
  videoModel?: string;
  videoVram?: number;

  // 開機設定 (需要 VM 關機)
  bootOrder?: string[];
  bootMenu?: boolean;

  // 電源管理 (可隨時修改)
  onPoweroff?: string;
  onReboot?: string;
  onCrash?: string;

  // 進階功能 (需要 VM 關機)
  acpi?: boolean;
  apic?: boolean;
  autostart?: boolean;
  clockOffset?: string;

  // CD-ROM (可熱插拔)
  isoPath?: string | null;  // null = 不變, "" = 彈出

  // 裝置 (需要 VM 關機)
  usb?: boolean;
  tablet?: boolean;
  serial?: boolean;
  tpm?: boolean;
}

export interface CreateVmRequest {
  // 基本設定
  name: string;            // VM 名稱
  description?: string;    // 描述/備註

  // CPU 設定
  vcpu: number;            // vCPU 數量
  cpuMode?: string;        // CPU 模式 (host-passthrough/host-model/custom)
  cpuSockets?: number;     // CPU 插槽數
  cpuCores?: number;       // 每插槽核心數
  cpuThreads?: number;     // 每核心執行緒數

  // 記憶體設定
  memoryMB: number;        // 記憶體 (MB)
  maxMemoryMB?: number;    // 最大記憶體 (MB)
  hugepages?: boolean;     // 啟用大分頁

  // 主磁碟設定 (向後相容)
  diskGB?: number;         // 磁碟大小 (GB) - 可選，使用 disks 時可省略
  diskFormat?: string;     // 磁碟格式 (qcow2/raw)
  diskBus?: string;        // 磁碟匯流排 (virtio/sata/scsi/ide)
  diskCache?: string;      // 快取模式 (none/writeback/writethrough)
  diskIo?: string;         // I/O 模式 (native/threads)

  // 多磁碟設定
  disks?: Disk[];          // 額外磁碟列表

  // 網路設定
  networkType?: string;    // 網路類型 (network/bridge/direct)
  networkSource?: string;  // 網路來源 (default/br0)
  networkModel?: string;   // 網卡型號 (virtio/e1000/rtl8139)
  macAddress?: string;     // MAC 地址

  // 顯示設定
  graphicsType?: string;   // 顯示類型 (vnc/spice)
  graphicsPort?: number;   // 顯示埠號 (-1=自動)
  graphicsListen?: string; // 監聽地址 (0.0.0.0/127.0.0.1)
  graphicsPassword?: string; // VNC/SPICE 密碼
  videoModel?: string;     // 顯示卡型號 (qxl/virtio/vga/cirrus)
  videoVram?: number;      // 顯示記憶體 (KB)

  // 開機設定
  bootOrder?: string[];    // 開機順序 (cdrom/hd/network)
  bootMenu?: boolean;      // 啟用開機選單
  uefi?: boolean;          // UEFI 開機
  secureBoot?: boolean;    // 安全開機

  // 系統設定
  isoPath?: string;        // ISO 映像路徑
  osType: string;          // 作業系統類型 (linux/windows)
  osVariant?: string;      // 作業系統變體 (ubuntu22.04/win11)
  machine?: string;        // 機器類型 (pc-i440fx/pc-q35)
  arch?: string;           // 架構 (x86_64/aarch64)

  // 電源管理
  onPoweroff?: string;     // 關機動作 (destroy/restart/preserve)
  onReboot?: string;       // 重啟動作 (restart/destroy)
  onCrash?: string;        // 當機動作 (destroy/restart/preserve)

  // 進階功能
  acpi?: boolean;          // 啟用 ACPI
  apic?: boolean;          // 啟用 APIC
  autostart?: boolean;     // 隨主機啟動
  clockOffset?: string;    // 時鐘偏移 (utc/localtime)

  // 裝置
  usb?: boolean;           // USB 控制器
  tablet?: boolean;        // USB 平板裝置 (改善滑鼠)
  serial?: boolean;        // 串列埠
  tpm?: boolean;           // TPM 裝置
}

// 預設值常數
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

// 選項列表
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

export interface IsoFile {
  name: string;       // 檔案名稱
  path: string;       // 完整路徑
  size: number;       // 檔案大小 (bytes)
}
export interface VncInfo {
  host: string;
  port: number;
  websocketUrl: string;
  password?: string;
}

// 使用者認證相關
export interface UserInfo {
  username: string;
  uid: number;
  gid: number;
  gecos?: string;       // 使用者全名/註解
  homeDir: string;
  shell: string;
  groups?: string[];    // 所屬群組列表
  locked?: boolean;     // 帳號是否被鎖定
  expireDate?: string;  // 帳號過期日期
  lastLogin?: string;   // 最後登入時間
}

export interface GroupInfo {
  name: string;
  gid: number;
  members: string[];
}

export interface PasswordInfo {
  username: string;
  minDays: number;      // 密碼最短使用天數
  maxDays: number;      // 密碼最長使用天數
  warnDays: number;     // 過期前警告天數
  inactiveDays: number; // 過期後停用天數
  expireDate?: string;  // 帳號過期日期
  lastChange?: string;  // 最後變更日期
  locked: boolean;      // 帳號是否被鎖定
}

export interface CreateUserOptions {
  username: string;
  password: string;
  shell?: string;
  createHome?: boolean;
  uid?: number;
  gid?: number;
  groups?: string[];
  gecos?: string;
  homeDir?: string;
  system?: boolean;
  expireDate?: string;
}

export interface CreateGroupOptions {
  name: string;
  gid?: number;
  system?: boolean;
  users?: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: UserInfo | null;
}

export interface FirewallRule {
  index: number;
  to: string;
  action: string;
  from: string;
  ipv6: boolean;
}

// ==================== iptables Types ====================

export interface IptablesRule {
  lineNumber: number;
  table: string;
  chain: string;
  target: string;
  protocol: string;
  source: string;
  destination: string;
  inInterface: string;
  outInterface: string;
  sourcePort?: number;
  destPort?: number;
  options: string;
  packetCount: number;
  byteCount: number;
}

export type IptablesTable = 'filter' | 'nat' | 'mangle';

export type IptablesChain = 'INPUT' | 'OUTPUT' | 'FORWARD' | 'PREROUTING' | 'POSTROUTING';

export interface AddIptablesRuleRequest {
  table?: string;
  chain: string;
  target: string;
  protocol?: string;
  source?: string;
  destination?: string;
  inInterface?: string;
  outInterface?: string;
  sourcePort?: number;
  destPort?: number;
  append?: boolean;
}

export interface CronJob {
  id?: string;        // 後端讀取時有，新增時可無
  expression: string; // Cron 表達式，例如 "0 3 * * *"
  command: string;    // 要執行的指令
  comment?: string;   // (選用) 註解
}

export interface ServiceItem {
  name: string;
  description: string;
  loadState: string;
  activeState: string;
  subState: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  permissions: string;
  lastModified: string;
}

export interface DiskInfo {
  name: string;
  mount: string;
  totalSpace: number;
  usedSpace: number;
  usableSpace: number;
}

export interface NetworkInfo {
  uploadRate: number;   // Bytes/sec
  downloadRate: number; // Bytes/sec
  totalSent: number;
  totalRecv: number;
}

export enum ContainerStatus {
  RUNNING = 'running',
  STOPPED = 'exited',
  PAUSED = 'paused',
  RESTARTING = 'restarting'
}

// System status from dashboard API
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

// Container data from Docker API
export interface ContainerDTO {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  portMapping: string;
}

export enum VmStatus {
  RUNNING = 'running',
  SHUTOFF = 'shutoff',
  PAUSED = 'paused',
  PROVISIONING = 'provisioning'
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  ports: string;
  uptime: string;
  cpuUsage: number;
  memUsage: number;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  subnet: string;
  gateway: string;
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  created: string;
}

export interface VirtualMachine {
  id: string;
  name: string;
  os: string;
  status: VmStatus;
  vcpu: number;
  memory: number; // in GB
  disk: number; // in GB
  ip: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
}

export interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  loadAverage: [number, number, number];
}

export interface SystemService {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'failed';
  subState: 'running' | 'dead' | 'exited';
  autoStart: boolean;
}

export interface NginxHost {
  id: string;
  domain: string;
  port: number;
  root: string;
  sslEnabled: boolean;
  status: 'enabled' | 'disabled';
}

export interface SslCertificate {
  id: string;
  domain: string;
  issuer: string;
  expiryDate: string;
  autoRenew: boolean;
}

export interface FileInfo {
  name: string;
  path: string;
  size: string;
  permissions: string;
  updated: string;
  type: 'file' | 'folder';
  owner: string;
}

export interface Database {
  id: string;
  name: string;
  type: 'MySQL' | 'PostgreSQL' | 'Redis';
  username: string;
  size: string;
  status: 'online' | 'offline';
  backup: string;
}

export interface WafRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  hits: number;
}

export enum TabView {
  DASHBOARD = 'dashboard',
  WEBSITE = 'website', // Nginx
  FTP = 'ftp',
  DATABASES = 'databases',
  DOCKER = 'docker',
  MONITOR = 'monitor',
  SECURITY = 'security', // Firewall
  WAF = 'waf',
  MAIL = 'mail',
  FILES = 'files',
  LOGS = 'logs',
  KVM = 'kvm',
  SERVICES = 'services',
  CRON = 'cron',
  USERS = 'users',
  TERMINAL = 'terminal',
  SETTINGS = 'settings'
}
