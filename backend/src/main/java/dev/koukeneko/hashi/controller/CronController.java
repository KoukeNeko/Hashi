package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.CronJobDTO;
import dev.koukeneko.hashi.service.platform.scheduler.SchedulerManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 排程任務 (Cron) 管理 Controller
 */
@RestController
@RequestMapping("/api/v1/cron")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CronController {

    private final SchedulerManager schedulerManager;

    /**
     * 列出所有排程任務
     *
     * @return 排程任務列表
     */
    @GetMapping
    public ResponseEntity<List<CronJobDTO>> listJobs() {
        return ResponseEntity.ok(schedulerManager.listJobs());
    }

    /**
     * 儲存排程任務列表
     * <p>
     * 此操作會覆蓋現有的 crontab 內容。若要刪除任務，請從列表中移除該任務後再儲存。
     * </p>
     *
     * @param jobs 新的排程任務列表
     * @return 成功回傳 200 OK
     */
    @PostMapping
    public ResponseEntity<Void> saveJobs(@RequestBody List<CronJobDTO> jobs) {
        schedulerManager.saveJobs(jobs);
        return ResponseEntity.ok().build();
    }
}
