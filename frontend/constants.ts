import {
    Container,
    ContainerStatus,
    DockerImage,
    DockerNetwork,
    DockerVolume,
    NginxHost,
    SslCertificate,
    Database,
    WafRule,
} from './types';

export const MOCK_CONTAINERS: Container[] = [
    {
        id: 'a1b2c3d4',
        name: 'nginx-proxy',
        image: 'nginx:latest',
        status: ContainerStatus.RUNNING,
        ports: '80:80, 443:443',
        uptime: '4 days',
        cpuUsage: 0.5,
        memUsage: 120,
    },
    {
        id: 'e5f6g7h8',
        name: 'postgres-db',
        image: 'postgres:15-alpine',
        status: ContainerStatus.RUNNING,
        ports: '5432:5432',
        uptime: '12 days',
        cpuUsage: 1.2,
        memUsage: 512,
    },
    {
        id: 'i9j0k1l2',
        name: 'redis-cache',
        image: 'redis:7',
        status: ContainerStatus.RUNNING,
        ports: '6379:6379',
        uptime: '12 days',
        cpuUsage: 0.1,
        memUsage: 64,
    },
    {
        id: 'm3n4o5p6',
        name: 'worker-node-01',
        image: 'custom/worker:v2',
        status: ContainerStatus.STOPPED,
        ports: '-',
        uptime: '0s',
        cpuUsage: 0,
        memUsage: 0,
    },
    {
        id: 'q7r8s9t0',
        name: 'grafana',
        image: 'grafana/grafana',
        status: ContainerStatus.PAUSED,
        ports: '3000:3000',
        uptime: '5 hours',
        cpuUsage: 0,
        memUsage: 256,
    },
];

export const MOCK_IMAGES: DockerImage[] = [
    {
        id: 'sha256:8b...3a',
        repository: 'nginx',
        tag: 'latest',
        size: '142MB',
        created: '2023-10-15',
    },
    {
        id: 'sha256:4c...9d',
        repository: 'postgres',
        tag: '15-alpine',
        size: '280MB',
        created: '2023-09-22',
    },
    { id: 'sha256:2a...1f', repository: 'redis', tag: '7', size: '117MB', created: '2023-10-01' },
    {
        id: 'sha256:5e...7b',
        repository: 'ubuntu',
        tag: '22.04',
        size: '78MB',
        created: '2023-08-10',
    },
    {
        id: 'sha256:9f...2c',
        repository: 'node',
        tag: '18-alpine',
        size: '176MB',
        created: '2023-10-20',
    },
];

export const MOCK_NETWORKS: DockerNetwork[] = [
    {
        id: 'ab12cd34ef56',
        name: 'bridge',
        driver: 'bridge',
        subnet: '172.17.0.0/16',
        gateway: '172.17.0.1',
    },
    { id: '123456789abc', name: 'host', driver: 'host', subnet: '-', gateway: '-' },
    {
        id: 'ef56ab12cd34',
        name: 'app-network',
        driver: 'bridge',
        subnet: '172.18.0.0/16',
        gateway: '172.18.0.1',
    },
];

export const MOCK_VOLUMES: DockerVolume[] = [
    {
        name: 'pg_data',
        driver: 'local',
        mountpoint: '/var/lib/docker/volumes/pg_data/_data',
        created: '2023-09-01',
    },
    {
        name: 'redis_data',
        driver: 'local',
        mountpoint: '/var/lib/docker/volumes/redis_data/_data',
        created: '2023-09-01',
    },
    {
        name: 'grafana_storage',
        driver: 'local',
        mountpoint: '/var/lib/docker/volumes/grafana_storage/_data',
        created: '2023-10-12',
    },
];

export const MOCK_FIREWALL_RULES = [
    {
        id: '1',
        port: '22',
        protocol: 'TCP',
        action: 'ALLOW',
        source: 'Anywhere',
        comment: 'SSH Access',
    },
    {
        id: '2',
        port: '80',
        protocol: 'TCP',
        action: 'ALLOW',
        source: 'Anywhere',
        comment: 'HTTP Web',
    },
    {
        id: '3',
        port: '443',
        protocol: 'TCP',
        action: 'ALLOW',
        source: 'Anywhere',
        comment: 'HTTPS Web',
    },
    {
        id: '4',
        port: '5432',
        protocol: 'TCP',
        action: 'ALLOW',
        source: '10.0.0.0/24',
        comment: 'Postgres Internal',
    },
    {
        id: '5',
        port: '9090',
        protocol: 'TCP',
        action: 'DENY',
        source: 'Anywhere',
        comment: 'Block Old Admin Port',
    },
];

export const MOCK_NGINX_HOSTS: NginxHost[] = [
    {
        id: '1',
        domain: 'api.hashi.local',
        port: 443,
        root: '/var/www/api',
        sslEnabled: true,
        status: 'enabled',
    },
    {
        id: '2',
        domain: 'dashboard.hashi.local',
        port: 443,
        root: '/var/www/dashboard',
        sslEnabled: true,
        status: 'enabled',
    },
    {
        id: '3',
        domain: 'legacy.hashi.local',
        port: 80,
        root: '/var/www/html',
        sslEnabled: false,
        status: 'disabled',
    },
];

export const MOCK_SSL_CERTIFICATES: SslCertificate[] = [
    {
        id: '1',
        domain: '*.hashi.local',
        issuer: "Let's Encrypt R3",
        expiryDate: '2023-12-15',
        autoRenew: true,
    },
    {
        id: '2',
        domain: 'hashi.local',
        issuer: "Let's Encrypt R3",
        expiryDate: '2023-12-15',
        autoRenew: true,
    },
    {
        id: '3',
        domain: 'legacy.hashi.local',
        issuer: 'Self Signed',
        expiryDate: '2024-05-20',
        autoRenew: false,
    },
];

export const MOCK_DATABASES: Database[] = [
    {
        id: '1',
        name: 'wp_main',
        type: 'MySQL',
        username: 'wp_user',
        size: '450 MB',
        status: 'online',
        backup: '2023-10-28',
    },
    {
        id: '2',
        name: 'app_production',
        type: 'PostgreSQL',
        username: 'postgres',
        size: '1.2 GB',
        status: 'online',
        backup: '2023-10-27',
    },
    {
        id: '3',
        name: 'cache_store',
        type: 'Redis',
        username: 'default',
        size: '64 MB',
        status: 'online',
        backup: '-',
    },
];

export const MOCK_WAF_RULES: WafRule[] = [
    {
        id: '1',
        name: 'SQL Injection Protection',
        description: 'Blocks common SQL injection patterns',
        enabled: true,
        hits: 1420,
    },
    {
        id: '2',
        name: 'XSS Protection',
        description: 'Filters Cross-Site Scripting attacks',
        enabled: true,
        hits: 85,
    },
    {
        id: '3',
        name: 'Bad Bot Blocker',
        description: 'Blocks known malicious user agents',
        enabled: true,
        hits: 12450,
    },
    {
        id: '4',
        name: 'Country Block (CN, RU)',
        description: 'Geo-IP blocking for high risk regions',
        enabled: false,
        hits: 0,
    },
    {
        id: '5',
        name: 'Rate Limiting',
        description: 'Limits requests to 100/min per IP',
        enabled: true,
        hits: 340,
    },
];

export const INITIAL_CPU_DATA = Array.from({ length: 20 }, (_, i) => ({
    name: i.toString(),
    uv: Math.floor(Math.random() * 30) + 10,
    down: Math.floor(Math.random() * 500) + 200,
    up: Math.floor(Math.random() * 200) + 50,
}));
