package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.CronJobDTO;
import dev.koukeneko.hashi.service.CronService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cron")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CronController {

    private final CronService cronService;

    @GetMapping
    public ResponseEntity<List<CronJobDTO>> listJobs() {
        return ResponseEntity.ok(cronService.listJobs());
    }

    // 更新整個列表 (刪除也是透過這個，傳送少了某個 job 的列表即可)
    @PostMapping
    public ResponseEntity<Void> saveJobs(@RequestBody List<CronJobDTO> jobs) {
        cronService.saveJobs(jobs);
        return ResponseEntity.ok().build();
    }
}
