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

export interface FirewallRule {
  id: string;
  port: string;
  protocol: 'TCP' | 'UDP' | 'ANY';
  action: 'ALLOW' | 'DENY';
  source: string; // IP or 'Anywhere'
  comment: string;
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
  TERMINAL = 'terminal',
  SETTINGS = 'settings'
}
