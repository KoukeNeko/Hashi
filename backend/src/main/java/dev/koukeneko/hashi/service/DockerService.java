package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.ContainerDTO;
import dev.koukeneko.hashi.model.dto.DockerImageDTO;
import dev.koukeneko.hashi.model.dto.DockerNetworkDTO;
import dev.koukeneko.hashi.model.dto.DockerVolumeDTO;

import java.util.List;

/**
 * Docker 容器管理服務介面
 */
public interface DockerService {
    /**
     * 列出所有容器
     *
     * @return 容器列表
     */
    List<ContainerDTO> listContainers();

    /**
     * 啟動指定容器
     *
     * @param containerId
     *                    容器 ID
     */
    void startContainer(String containerId);

    /**
     * 停止指定容器
     *
     * @param containerId
     *                    容器 ID
     */
    void stopContainer(String containerId);

    /**
     * 重啟指定容器
     *
     * @param containerId
     *                    容器 ID
     */
    void restartContainer(String containerId);

    /**
     * 列出所有映像檔
     *
     * @return 映像檔列表
     */
    List<DockerImageDTO> listImages();

    /**
     * 下載映像檔
     *
     * @param repository 倉庫名稱
     * @param tag        標籤
     */
    void pullImage(String repository, String tag);

    /**
     * 刪除映像檔
     *
     * @param imageId 映像檔 ID
     */
    void removeImage(String imageId);

    /**
     * 列出所有網路
     *
     * @return 網路列表
     */
    List<DockerNetworkDTO> listNetworks();

    /**
     * 建立網路
     *
     * @param name   網路名稱
     * @param driver 驅動程式 (bridge, overlay, etc.)
     */
    void createNetwork(String name, String driver);

    /**
     * 刪除網路
     *
     * @param networkId 網路 ID
     */
    void removeNetwork(String networkId);

    /**
     * 列出所有儲存卷
     *
     * @return 儲存卷列表
     */
    List<DockerVolumeDTO> listVolumes();

    /**
     * 建立儲存卷
     *
     * @param name 儲存卷名稱
     */
    void createVolume(String name);

    /**
     * 刪除儲存卷
     *
     * @param volumeName 儲存卷名稱
     */
    void removeVolume(String volumeName);
}
