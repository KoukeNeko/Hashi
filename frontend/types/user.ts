/**
 * User and authentication related types
 */

/** User account information */
export interface UserInfo {
    username: string;
    uid: number;
    gid: number;
    gecos?: string;
    homeDir: string;
    shell: string;
    groups?: string[];
    locked?: boolean;
    expireDate?: string;
    lastLogin?: string;
}

/** Group information */
export interface GroupInfo {
    name: string;
    gid: number;
    members: string[];
}

/** Password policy information */
export interface PasswordInfo {
    username: string;
    minDays: number;
    maxDays: number;
    warnDays: number;
    inactiveDays: number;
    expireDate?: string;
    lastChange?: string;
    locked: boolean;
}

/** Options for creating a new user */
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

/** Options for creating a new group */
export interface CreateGroupOptions {
    name: string;
    gid?: number;
    system?: boolean;
    users?: string[];
}

/** Authentication response */
export interface AuthResponse {
    success: boolean;
    message: string;
    user: UserInfo | null;
}
