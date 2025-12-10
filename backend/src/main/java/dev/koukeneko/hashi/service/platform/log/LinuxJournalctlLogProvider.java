package dev.koukeneko.hashi.service.platform.log;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Linux journalctl Log 串流實作
 */
@Slf4j
public class LinuxJournalctlLogProvider implements LogStreamProvider {

    private static final int LOG_TAIL_LINES = 100;

    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @Override
    public Process startLogStream(WebSocketSession session) throws Exception {
        ProcessBuilder builder = new ProcessBuilder(
                "journalctl", "-f", "-n", String.valueOf(LOG_TAIL_LINES), "--no-pager");

        Process process = builder.start();
        streamLogs(process.getInputStream(), session);
        return process;
    }

    @Override
    public void stopLogStream(Process process) {
        if (process != null) {
            process.destroy();
        }
    }

    private void streamLogs(InputStream inputStream, WebSocketSession session) {
        executorService.submit(() -> {
            byte[] buffer = new byte[1024];
            int length;
            try {
                while ((length = inputStream.read(buffer)) != -1) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(new String(buffer, 0, length, StandardCharsets.UTF_8)));
                    } else {
                        break;
                    }
                }
            } catch (IOException e) {
                // Connection closed or process died
            }
        });
    }
}
