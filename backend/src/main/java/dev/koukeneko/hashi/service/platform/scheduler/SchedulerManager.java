package dev.koukeneko.hashi.service.platform.scheduler;

import dev.koukeneko.hashi.model.dto.CronJobDTO;

import java.util.List;

/**
 * 排程管理介面 Linux: crontab Windows: Task Scheduler
 */
public interface SchedulerManager {

    /**
     * 列出所有排程任務
     */
    List<CronJobDTO> listJobs();

    /**
     * 儲存所有排程（覆蓋式更新）
     */
    void saveJobs(List<CronJobDTO> jobs);
}
