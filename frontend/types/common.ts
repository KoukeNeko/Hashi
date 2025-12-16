/**
 * Common and miscellaneous types
 */

/** Cron job configuration */
export interface CronJob {
    id?: string;
    expression: string;
    command: string;
    comment?: string;
}

/** Log entry from journalctl */
export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    service: string;
    message: string;
}

/** Database connection information */
export interface Database {
    id: string;
    name: string;
    type: 'MySQL' | 'PostgreSQL' | 'Redis';
    username: string;
    size: string;
    status: 'online' | 'offline';
    backup: string;
}

/** WAF rule configuration */
export interface WafRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    hits: number;
}

/** Application tab/view enum */
export enum TabView {
    DASHBOARD = 'dashboard',
    WEBSITE = 'website',
    FTP = 'ftp',
    DATABASES = 'databases',
    DOCKER = 'docker',
    MONITOR = 'monitor',
    SECURITY = 'security',
    WAF = 'waf',
    MAIL = 'mail',
    FILES = 'files',
    LOGS = 'logs',
    KVM = 'kvm',
    SERVICES = 'services',
    CRON = 'cron',
    DISKS = 'disks',
    NETWORK = 'network',
    USERS = 'users',
    TERMINAL = 'terminal',
    PACKAGES = 'packages',
    SETTINGS = 'settings',
}
