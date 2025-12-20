package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.StoragePoolDTO;
import dev.koukeneko.hashi.model.dto.request.CreatePoolRequest;

import java.util.List;

/**
 * 抽象儲存池服務介面
 * 支援多種儲存後端 (mdadm, ZFS 等)
 */
public interface StoragePoolService {

    /**
     * 取得儲存提供者名稱
     * 
     * @return "mdadm" 或 "zfs"
     */
    String getProviderName();

    /**
     * 列出所有儲存池/陣列
     */
    List<StoragePoolDTO> listPools();

    /**
     * 取得單一儲存池詳情
     */
    StoragePoolDTO getPool(String name);

    /**
     * 建立新儲存池
     */
    void createPool(CreatePoolRequest request);

    /**
     * 刪除儲存池
     */
    void destroyPool(String name);

    /**
     * 新增磁碟到儲存池
     */
    void addDisk(String poolName, String diskDevice);

    /**
     * 從儲存池移除磁碟
     */
    void removeDisk(String poolName, String diskDevice);

    /**
     * 標記磁碟為故障
     */
    void markDiskFaulty(String poolName, String diskDevice);
}
