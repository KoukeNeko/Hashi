/**
 * Docker and container related types
 */

/** Docker daemon connectivity probe result */
export interface DockerStatus {
    installed: boolean;
    daemonVersion: string | null;
    apiVersion: string | null;
    socketPath: string | null;
    message: string | null;
}

/** Container status enum */
export enum ContainerStatus {
    RUNNING = 'running',
    STOPPED = 'exited',
    PAUSED = 'paused',
    RESTARTING = 'restarting',
}

/** Container data from Docker API */
export interface ContainerDTO {
    id: string;
    name: string;
    image: string;
    state: string;
    status: string;
    portMapping: string;
}

/** Container with runtime stats */
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

/** Docker image information */
export interface DockerImage {
    id: string;
    repository: string;
    tag: string;
    size: string;
    created: string;
}

/** Docker network configuration */
export interface DockerNetwork {
    id: string;
    name: string;
    driver: string;
    subnet: string;
    gateway: string;
}

/** Docker volume information */
export interface DockerVolume {
    name: string;
    driver: string;
    mountpoint: string;
    created: string;
}
