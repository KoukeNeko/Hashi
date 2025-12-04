
import { Container, ContainerStatus, DockerImage, DockerNetwork, DockerVolume, FirewallRule, LogEntry, SystemService, VirtualMachine, VmStatus, NginxHost, SslCertificate, FileInfo, Database, CronJob, WafRule } from './types';

export const MOCK_CONTAINERS: Container[] = [
  {
    id: 'a1b2c3d4',
    name: 'nginx-proxy',
    image: 'nginx:latest',
    status: ContainerStatus.RUNNING,
    ports: '80:80, 443:443',
    uptime: '4 days',
    cpuUsage: 0.5,
    memUsage: 120
  },
  {
    id: 'e5f6g7h8',
    name: 'postgres-db',
    image: 'postgres:15-alpine',
    status: ContainerStatus.RUNNING,
    ports: '5432:5432',
    uptime: '12 days',
    cpuUsage: 1.2,
    memUsage: 512
  },
  {
    id: 'i9j0k1l2',
    name: 'redis-cache',
    image: 'redis:7',
    status: ContainerStatus.RUNNING,
    ports: '6379:6379',
    uptime: '12 days',
    cpuUsage: 0.1,
    memUsage: 64
  },
  {
    id: 'm3n4o5p6',
    name: 'worker-node-01',
    image: 'custom/worker:v2',
    status: ContainerStatus.STOPPED,
    ports: '-',
    uptime: '0s',
    cpuUsage: 0,
    memUsage: 0
  },
  {
    id: 'q7r8s9t0',
    name: 'grafana',
    image: 'grafana/grafana',
    status: ContainerStatus.PAUSED,
    ports: '3000:3000',
    uptime: '5 hours',
    cpuUsage: 0,
    memUsage: 256
  }
];

export const MOCK_IMAGES: DockerImage[] = [
    { id: 'sha256:8b...3a', repository: 'nginx', tag: 'latest', size: '142MB', created: '2023-10-15' },
    { id: 'sha256:4c...9d', repository: 'postgres', tag: '15-alpine', size: '280MB', created: '2023-09-22' },
    { id: 'sha256:2a...1f', repository: 'redis', tag: '7', size: '117MB', created: '2023-10-01' },
    { id: 'sha256:5e...7b', repository: 'ubuntu', tag: '22.04', size: '78MB', created: '2023-08-10' },
    { id: 'sha256:9f...2c', repository: 'node', tag: '18-alpine', size: '176MB', created: '2023-10-20' },
];

export const MOCK_NETWORKS: DockerNetwork[] = [
    { id: 'ab12cd34ef56', name: 'bridge', driver: 'bridge', subnet: '172.17.0.0/16', gateway: '172.17.0.1' },
    { id: '123456789abc', name: 'host', driver: 'host', subnet: '-', gateway: '-' },
    { id: 'ef56ab12cd34', name: 'app-network', driver: 'bridge', subnet: '172.18.0.0/16', gateway: '172.18.0.1' },
];

export const MOCK_VOLUMES: DockerVolume[] = [
    { name: 'pg_data', driver: 'local', mountpoint: '/var/lib/docker/volumes/pg_data/_data', created: '2023-09-01' },
    { name: 'redis_data', driver: 'local', mountpoint: '/var/lib/docker/volumes/redis_data/_data', created: '2023-09-01' },
    { name: 'grafana_storage', driver: 'local', mountpoint: '/var/lib/docker/volumes/grafana_storage/_data', created: '2023-10-12' },
];

export const MOCK_VMS: VirtualMachine[] = [
  {
    id: 'vm-101',
    name: 'prod-app-server',
    os: 'Ubuntu 22.04 LTS',
    status: VmStatus.RUNNING,
    vcpu: 4,
    memory: 16,
    disk: 500,
    ip: '192.168.1.101'
  },
  {
    id: 'vm-102',
    name: 'win-legacy-erp',
    os: 'Windows Server 2019',
    status: VmStatus.RUNNING,
    vcpu: 8,
    memory: 32,
    disk: 1024,
    ip: '192.168.1.102'
  },
  {
    id: 'vm-103',
    name: 'dev-sandbox',
    os: 'Debian 12',
    status: VmStatus.SHUTOFF,
    vcpu: 2,
    memory: 4,
    disk: 50,
    ip: '192.168.1.105'
  },
  {
    id: 'vm-104',
    name: 'arch-build-agent',
    os: 'Arch Linux',
    status: VmStatus.PROVISIONING,
    vcpu: 16,
    memory: 64,
    disk: 200,
    ip: '-'
  }
];

export const MOCK_LOGS: LogEntry[] = [
  { id: '1', timestamp: '2023-10-27 10:00:01', level: 'INFO', service: 'systemd', message: 'Started Docker Application Container Engine.' },
  { id: '2', timestamp: '2023-10-27 10:01:23', level: 'WARN', service: 'kernel', message: 'TCP: request_sock_TCP: Possible SYN flooding on port 80.' },
  { id: '3', timestamp: '2023-10-27 10:05:45', level: 'INFO', service: 'sshd', message: 'Accepted publickey for root from 10.0.0.5 port 54321 ssh2' },
  { id: '4', timestamp: '2023-10-27 10:15:00', level: 'ERROR', service: 'nginx', message: 'Connection reset by peer while reading response header from upstream' },
  { id: '5', timestamp: '2023-10-27 10:20:11', level: 'DEBUG', service: 'kvm', message: 'virtio-net: link up' }
];

export const MOCK_FIREWALL_RULES: FirewallRule[] = [
    { id: '1', port: '22', protocol: 'TCP', action: 'ALLOW', source: 'Anywhere', comment: 'SSH Access' },
    { id: '2', port: '80', protocol: 'TCP', action: 'ALLOW', source: 'Anywhere', comment: 'HTTP Web' },
    { id: '3', port: '443', protocol: 'TCP', action: 'ALLOW', source: 'Anywhere', comment: 'HTTPS Web' },
    { id: '4', port: '5432', protocol: 'TCP', action: 'ALLOW', source: '10.0.0.0/24', comment: 'Postgres Internal' },
    { id: '5', port: '9090', protocol: 'TCP', action: 'DENY', source: 'Anywhere', comment: 'Block Old Admin Port' },
];

export const MOCK_SERVICES: SystemService[] = [
    { name: 'nginx.service', description: 'A high performance web server', status: 'active', subState: 'running', autoStart: true },
    { name: 'docker.service', description: 'Docker Application Container Engine', status: 'active', subState: 'running', autoStart: true },
    { name: 'ssh.service', description: 'OpenBSD Secure Shell server', status: 'active', subState: 'running', autoStart: true },
    { name: 'ufw.service', description: 'Uncomplicated firewall', status: 'active', subState: 'exited', autoStart: true },
    { name: 'apache2.service', description: 'The Apache HTTP Server', status: 'inactive', subState: 'dead', autoStart: false },
    { name: 'bluetooth.service', description: 'Bluetooth service', status: 'inactive', subState: 'dead', autoStart: false },
    { name: 'cron.service', description: 'Regular background program processing daemon', status: 'active', subState: 'running', autoStart: true },
];

export const MOCK_NGINX_HOSTS: NginxHost[] = [
  { id: '1', domain: 'api.hashi.local', port: 443, root: '/var/www/api', sslEnabled: true, status: 'enabled' },
  { id: '2', domain: 'dashboard.hashi.local', port: 443, root: '/var/www/dashboard', sslEnabled: true, status: 'enabled' },
  { id: '3', domain: 'legacy.hashi.local', port: 80, root: '/var/www/html', sslEnabled: false, status: 'disabled' },
];

export const MOCK_SSL_CERTIFICATES: SslCertificate[] = [
  { id: '1', domain: '*.hashi.local', issuer: "Let's Encrypt R3", expiryDate: '2023-12-15', autoRenew: true },
  { id: '2', domain: 'hashi.local', issuer: "Let's Encrypt R3", expiryDate: '2023-12-15', autoRenew: true },
  { id: '3', domain: 'legacy.hashi.local', issuer: "Self Signed", expiryDate: '2024-05-20', autoRenew: false },
];

export const MOCK_FILES: FileInfo[] = [
  { name: 'www', path: '/var/www', size: '4.2 KB', permissions: 'rwxr-xr-x', updated: '2023-10-28 14:00', type: 'folder', owner: 'root' },
  { name: 'logs', path: '/var/logs', size: '128 MB', permissions: 'rwxr-xr-x', updated: '2023-10-28 14:05', type: 'folder', owner: 'root' },
  { name: 'docker', path: '/var/lib/docker', size: '24 GB', permissions: 'rwx--x--x', updated: '2023-10-28 13:50', type: 'folder', owner: 'root' },
  { name: 'nginx.conf', path: '/etc/nginx/nginx.conf', size: '2.1 KB', permissions: 'rw-r--r--', updated: '2023-09-15 09:30', type: 'file', owner: 'root' },
  { name: 'app.env', path: '/var/www/api/app.env', size: '540 B', permissions: 'rw-------', updated: '2023-10-20 11:15', type: 'file', owner: 'www-data' },
];

export const MOCK_DATABASES: Database[] = [
  { id: '1', name: 'wp_main', type: 'MySQL', username: 'wp_user', size: '450 MB', status: 'online', backup: '2023-10-28' },
  { id: '2', name: 'app_production', type: 'PostgreSQL', username: 'postgres', size: '1.2 GB', status: 'online', backup: '2023-10-27' },
  { id: '3', name: 'cache_store', type: 'Redis', username: 'default', size: '64 MB', status: 'online', backup: '-' },
];

export const MOCK_CRON_JOBS: CronJob[] = [
  { id: '1', name: 'Certbot Renewal', schedule: '0 0 1 * *', command: 'certbot renew --quiet', status: 'active', lastRun: '2023-10-01 00:00' },
  { id: '2', name: 'DB Backup', schedule: '0 2 * * *', command: '/usr/local/bin/backup_db.sh', status: 'active', lastRun: '2023-10-28 02:00' },
  { id: '3', name: 'Log Rotation', schedule: '0 0 * * 0', command: 'logrotate /etc/logrotate.conf', status: 'active', lastRun: '2023-10-22 00:00' },
  { id: '4', name: 'Temp Cleanup', schedule: '30 3 * * *', command: 'rm -rf /tmp/*', status: 'disabled', lastRun: '2023-09-15 03:30' },
];

export const MOCK_WAF_RULES: WafRule[] = [
  { id: '1', name: 'SQL Injection Protection', description: 'Blocks common SQL injection patterns', enabled: true, hits: 1420 },
  { id: '2', name: 'XSS Protection', description: 'Filters Cross-Site Scripting attacks', enabled: true, hits: 85 },
  { id: '3', name: 'Bad Bot Blocker', description: 'Blocks known malicious user agents', enabled: true, hits: 12450 },
  { id: '4', name: 'Country Block (CN, RU)', description: 'Geo-IP blocking for high risk regions', enabled: false, hits: 0 },
  { id: '5', name: 'Rate Limiting', description: 'Limits requests to 100/min per IP', enabled: true, hits: 340 },
];

export const INITIAL_CPU_DATA = Array.from({ length: 20 }, (_, i) => ({
  name: i.toString(),
  uv: Math.floor(Math.random() * 30) + 10,
  down: Math.floor(Math.random() * 500) + 200, // KB/s
  up: Math.floor(Math.random() * 200) + 50,   // KB/s
}));

export const MOCK_DISK_USAGE = [
    { path: '/', used: 80.61, total: 1005.44, percent: 8, color: '#10b981' },
    { path: '/home', used: 12.20, total: 50.00, percent: 24, color: '#a855f7' },
    { path: '/var/lib/docker', used: 156.4, total: 500.0, percent: 31, color: '#f59e0b' },
];
