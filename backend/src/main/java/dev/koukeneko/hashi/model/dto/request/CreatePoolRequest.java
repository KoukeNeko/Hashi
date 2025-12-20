package dev.koukeneko.hashi.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 建立儲存池請求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePoolRequest {

    /**
     * 陣列名稱 (如 md0, md1)
     */
    @NotBlank(message = "陣列名稱不可為空")
    private String name;

    /**
     * RAID 等級: raid0, raid1, raid5, raid6, raid10
     */
    @NotBlank(message = "RAID 等級不可為空")
    @Pattern(regexp = "^(raid0|raid1|raid5|raid6|raid10)$", message = "不支援的 RAID 等級")
    private String level;

    /**
     * 組成磁碟裝置路徑列表
     */
    @NotEmpty(message = "至少需要一個磁碟")
    private List<String> disks;

    /**
     * 備用磁碟裝置路徑列表 (選填)
     */
    private List<String> spareDisks;

    /**
     * 是否格式化並掛載
     */
    private boolean formatAndMount;

    /**
     * 掛載點 (formatAndMount 為 true 時使用)
     */
    private String mountPoint;

    /**
     * 檔案系統類型 (formatAndMount 為 true 時使用, 預設 ext4)
     */
    private String filesystem;
}
