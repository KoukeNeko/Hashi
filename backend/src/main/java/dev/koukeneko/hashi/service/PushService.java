package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.SystemStatusDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * WebSocket 推播服務
 * 定時推送系統狀態給訂閱的前端客戶端
 */
@Service
@RequiredArgsConstructor
public class PushService {

    private final DashboardService dashboardService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 定時推送系統狀態
     * <p>
     * 每秒執行一次，將最新的系統狀態推送至 /topic/status 頻道
     * </p>
     */
    @Scheduled(fixedRate = 1000)
    public void pushSystemStatus() {
        SystemStatusDTO status = dashboardService.getSystemStatus();
        messagingTemplate.convertAndSend("/topic/status", status);
    }
}
