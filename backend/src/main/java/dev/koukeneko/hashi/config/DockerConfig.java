package dev.koukeneko.hashi.config;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class DockerConfig {

    public static final String DOCKER_SOCKET_PATH = "/var/run/docker.sock";
    public static final String DOCKER_HOST_URI = "unix://" + DOCKER_SOCKET_PATH;

    @Bean
    public DockerClient dockerClient() {
        // 1. 強制指定 Docker Socket 路徑，避免它去連 localhost:2375
        DefaultDockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .withDockerHost(DOCKER_HOST_URI)
                .build();

        // 2. 設定傳輸層 (使用 Apache HttpClient 5)
        DockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .maxConnections(100)
                .connectionTimeout(Duration.ofSeconds(30))
                .responseTimeout(Duration.ofSeconds(45))
                .build();

        // 3. 建立實例
        return DockerClientImpl.getInstance(config, httpClient);
    }
}
