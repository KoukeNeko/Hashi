package dev.koukeneko.hashi.websocket;

import dev.koukeneko.hashi.model.dto.VncInfoDTO;
import dev.koukeneko.hashi.service.VirtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Component
@RequiredArgsConstructor
public class VncWebSocketHandler extends BinaryWebSocketHandler {

    private final VirtService virtService;
    private final ConcurrentHashMap<String, VncConnection> connections = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String vmName = extractVmName(session);
        if (vmName == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Invalid VM name"));
            return;
        }

        log.info("VNC WebSocket connection established for VM: {}", vmName);

        try {
            // 取得 VNC 連線資訊
            VncInfoDTO vncInfo = virtService.getVncInfo(vmName);
            
            // 建立到 VNC server 的 TCP 連線
            Socket vncSocket = new Socket(vncInfo.host(), vncInfo.port());
            vncSocket.setTcpNoDelay(true);
            
            VncConnection conn = new VncConnection(vncSocket, session);
            connections.put(session.getId(), conn);

            // 啟動讀取 VNC server 的執行緒
            executor.submit(() -> {
                try {
                    InputStream in = vncSocket.getInputStream();
                    byte[] buffer = new byte[65536];
                    int bytesRead;
                    
                    while ((bytesRead = in.read(buffer)) != -1 && session.isOpen()) {
                        byte[] data = new byte[bytesRead];
                        System.arraycopy(buffer, 0, data, 0, bytesRead);
                        session.sendMessage(new BinaryMessage(ByteBuffer.wrap(data)));
                    }
                } catch (IOException e) {
                    if (session.isOpen()) {
                        log.error("Error reading from VNC: {}", e.getMessage());
                    }
                } finally {
                    closeConnection(session.getId());
                }
            });

        } catch (Exception e) {
            log.error("Failed to establish VNC connection for VM {}: {}", vmName, e.getMessage());
            session.close(CloseStatus.SERVER_ERROR.withReason(e.getMessage()));
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        VncConnection conn = connections.get(session.getId());
        if (conn != null && conn.socket.isConnected()) {
            try {
                OutputStream out = conn.socket.getOutputStream();
                out.write(message.getPayload().array());
                out.flush();
            } catch (IOException e) {
                log.error("Error writing to VNC: {}", e.getMessage());
                closeConnection(session.getId());
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("VNC WebSocket connection closed: {}", status);
        closeConnection(session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("VNC WebSocket transport error: {}", exception.getMessage());
        closeConnection(session.getId());
    }

    private void closeConnection(String sessionId) {
        VncConnection conn = connections.remove(sessionId);
        if (conn != null) {
            try {
                conn.socket.close();
            } catch (IOException e) {
                // ignore
            }
            try {
                if (conn.session.isOpen()) {
                    conn.session.close();
                }
            } catch (IOException e) {
                // ignore
            }
        }
    }

    private String extractVmName(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;
        
        String path = uri.getPath();
        // /api/v1/virt/vms/{vmName}/vnc
        String[] parts = path.split("/");
        if (parts.length >= 6 && "vnc".equals(parts[parts.length - 1])) {
            return parts[parts.length - 2];
        }
        return null;
    }

    private record VncConnection(Socket socket, WebSocketSession session) {}
}
