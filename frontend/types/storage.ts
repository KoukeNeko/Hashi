/**
 * 儲存池管理相關類型
 */

/**
 * 儲存池中的磁碟資訊
 */
export interface StorageDisk {
    device: string;
    status: 'active' | 'spare' | 'faulty' | 'rebuilding';
    size: number;
    model?: string;
    serial?: string;
    raidDiskNumber?: number;
}

/**
 * 儲存池資訊 (mdadm RAID 或未來的 ZFS pool)
 */
export interface StoragePool {
    name: string;
    device: string;
    provider: 'mdadm' | 'zfs';
    level: string;
    status: 'ONLINE' | 'DEGRADED' | 'REBUILDING' | 'OFFLINE';
    totalSize: number;
    usedSize: number;
    diskCount: number;
    activeDiskCount: number;
    spareDiskCount: number;
    rebuildProgress?: number;
    uuid?: string;
    disks: StorageDisk[];
}

/**
 * 建立儲存池請求
 */
export interface CreatePoolRequest {
    name: string;
    level: 'raid0' | 'raid1' | 'raid5' | 'raid6' | 'raid10';
    disks: string[];
    spareDisks?: string[];
    formatAndMount?: boolean;
    mountPoint?: string;
    filesystem?: string;
}

/**
 * S.M.A.R.T. 磁碟屬性
 */
export interface SmartAttribute {
    id: number;
    name: string;
    value: number;
    worst: number;
    threshold: number;
    rawValue: string;
    type: string;
    failing: boolean;
}

/**
 * S.M.A.R.T. 磁碟健康資訊
 */
export interface SmartInfo {
    device: string;
    model?: string;
    serial?: string;
    healthStatus: 'PASSED' | 'FAILED' | 'UNKNOWN';
    temperature?: number;
    powerOnHours?: number;
    powerCycleCount?: number;
    reallocatedSectorCount?: number;
    smartSupported: boolean;
    smartEnabled: boolean;
    attributes?: SmartAttribute[];
}
