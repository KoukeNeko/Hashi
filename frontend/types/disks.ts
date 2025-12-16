export interface SystemPartition {
    name: string;
    path: string;
    size: number;
    fstype: string;
    mountpoint: string;
    uuid: string;
    label: string;
}

export interface SystemDisk {
    name: string;
    path: string;
    model: string;
    serial: string;
    size: number;
    type: string;
    removable: boolean;
    partitions: SystemPartition[];
}
