package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.SystemStatusDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PushService {

    private final DashboardService dashboardService;
    private final SimpMessagingTemplate messagingTemplate; // Spring 用來推送 WebSocket 的工具

    // 每 1000 毫秒 (1秒) 執行一次
    @Scheduled(fixedRate = 1000)
    public void pushSystemStatus() {
        // 1. 獲取最新狀態
        SystemStatusDTO status = dashboardService.getSystemStatus();

        // 2. 推送到訂閱了 "/topic/status" 的前端客戶端
        messagingTemplate.convertAndSend("/topic/status", status);
    }
}
