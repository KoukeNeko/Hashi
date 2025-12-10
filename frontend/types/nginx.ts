/**
 * Nginx web server related types
 */

/** Nginx host type */
export type NginxHostType = 'static' | 'proxy' | 'php';

/** Nginx virtual host configuration (DTO) */
export interface NginxHostDTO {
    name: string;
    domain: string;
    port: number;
    type: NginxHostType;
    root?: string;
    proxyPass?: string;
    sslEnabled: boolean;
    enabled: boolean;
    configPath: string;
    gzip: boolean;
    rateLimit: boolean;
    rateLimitRate?: number;
    aliases: string[];
}

/** Nginx service status (DTO) */
export interface NginxStatusDTO {
    running: boolean;
    enabled: boolean;
    version: string;
    configValid: boolean;
    configMessage: string;
}

/** SSL certificate information (DTO) */
export interface SslCertDTO {
    domain: string;
    issuer: string;
    expireDate: string;
    daysRemaining: number;
    autoRenew: boolean;
    certPath: string;
    keyPath: string;
    source: string;
}

/** Request to create Nginx host */
export interface CreateNginxHostRequest {
    name?: string;
    domain: string;
    port?: number;
    type?: NginxHostType;
    root?: string;
    proxyPass?: string;
    requestSsl?: boolean;
    sslProvider?: 'certbot' | 'acme';
    gzip?: boolean;
    rateLimit?: boolean;
    rateLimitRate?: number;
    aliases?: string[];
}

/** Legacy Nginx host interface */
export interface NginxHost {
    id: string;
    domain: string;
    port: number;
    root: string;
    sslEnabled: boolean;
    status: 'enabled' | 'disabled';
}

/** Legacy SSL certificate interface */
export interface SslCertificate {
    id: string;
    domain: string;
    issuer: string;
    expiryDate: string;
    autoRenew: boolean;
}
