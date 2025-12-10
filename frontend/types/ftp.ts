/**
 * FTP server related types
 */

/** Supported FTP server types */
export type FtpServerType = 'vsftpd' | 'proftpd' | 'pure-ftpd';

/** FTP server status information */
export interface FtpServerInfo {
    type: FtpServerType;
    serviceName: string;
    configPath: string;
    running: boolean;
    enabled: boolean;
}

/** FTP user account */
export interface FtpUser {
    username: string;
    homeDir: string;
    enabled: boolean;
}

/** Request to create FTP user */
export interface CreateFtpUserRequest {
    username: string;
    password: string;
    homeDir?: string;
}

/** Request to update FTP user */
export interface UpdateFtpUserRequest {
    password?: string;
    homeDir?: string;
    moveContent?: boolean;
}
