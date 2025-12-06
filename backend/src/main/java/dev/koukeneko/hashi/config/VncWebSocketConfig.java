package dev.koukeneko.hashi.config;

import dev.koukeneko.hashi.websocket.VncWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class VncWebSocketConfig implements WebSocketConfigurer {

    private final VncWebSocketHandler vncWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(vncWebSocketHandler, "/api/v1/virt/vms/*/vnc")
                .setAllowedOrigins("*");
    }
}
