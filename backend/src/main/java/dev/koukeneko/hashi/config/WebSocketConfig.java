package dev.koukeneko.hashi.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // 啟用 STOMP 訊息代理
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 啟用一個簡單的記憶體內訊息代理，前端訂閱的路徑前綴為 /topic
        config.enableSimpleBroker("/topic");
        // 設定客戶端發送訊息的路徑前綴 (目前我們只是單向推播，這個暫時用不到，但設著好)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 註冊 WebSocket 端點，前端連線要連這個 URL: http://localhost:8080/ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // 允許跨域 (React 開發環境)
                .withSockJS(); // 啟用 SockJS fallback (萬一瀏覽器不支援 WS，會自動降級成 HTTP)
    }
}
