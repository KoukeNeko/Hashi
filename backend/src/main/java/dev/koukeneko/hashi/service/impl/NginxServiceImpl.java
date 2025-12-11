package dev.koukeneko.hashi.service.impl;

import dev.koukeneko.hashi.model.dto.*;
import dev.koukeneko.hashi.service.NginxService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

/**
 * Nginx 管理服務實作 管理 /etc/nginx/sites-available 和 sites-enabled
 */
@Service
@Slf4j
public class NginxServiceImpl implements NginxService {

    private static final String SITES_AVAILABLE = "/etc/nginx/sites-available";
    private static final String SITES_ENABLED = "/etc/nginx/sites-enabled";
    private static final String CERTBOT_LIVE_DIR = "/etc/letsencrypt/live";

    // ==================== 服務控制 ====================

    @Override
    public NginxStatusDTO getStatus() {
        boolean running = isServiceRunning();
        boolean enabled = isServiceEnabled();
        String version = getNginxVersion();
        String testResult = testConfig();
        boolean configValid = testResult.contains("syntax is ok");

        return NginxStatusDTO.builder()
                .running(running)
                .enabled(enabled)
                .version(version)
                .configValid(configValid)
                .configMessage(testResult)
                .build();
    }

    @Override
    public boolean reload() {
        return executeCommand("sudo", "systemctl", "reload", "nginx");
    }

    @Override
    public String testConfig() {
        try {
            ProcessBuilder pb = new ProcessBuilder("sudo", "nginx", "-t");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String output = readProcessOutput(process);
            process.waitFor();
            return output;
        } catch (Exception e) {
            log.error("Failed to test nginx config", e);
            return "Error: " + e.getMessage();
        }
    }

    // ==================== Virtual Host 管理 ====================

    @Override
    public List<NginxHostDTO> listHosts() {
        List<NginxHostDTO> hosts = new ArrayList<>();
        Path availablePath = Path.of(SITES_AVAILABLE);

        if (!Files.exists(availablePath)) {
            log.warn("Nginx sites-available directory not found: {}", SITES_AVAILABLE);
            return hosts;
        }

        try (var stream = Files.list(availablePath)) {
            stream.filter(Files::isRegularFile)
                    .filter(p -> !p.getFileName().toString().equals("default"))
                    .forEach(configPath -> {
                        NginxHostDTO host = parseConfigFile(configPath);
                        if (host != null) {
                            hosts.add(host);
                        }
                    });
        } catch (IOException e) {
            log.error("Failed to list nginx hosts", e);
        }

        return hosts;
    }

    @Override
    public NginxHostDTO getHost(String name) {
        Path configPath = Path.of(SITES_AVAILABLE, name);
        if (!Files.exists(configPath)) {
            return null;
        }
        return parseConfigFile(configPath);
    }

    @Override
    public String getHostConfig(String name) {
        try {
            Path configPath = Path.of(SITES_AVAILABLE, name);
            if (!Files.exists(configPath)) {
                return null;
            }
            return Files.readString(configPath);
        } catch (IOException e) {
            log.error("Failed to read config for host: {}", name, e);
            return null;
        }
    }

    @Override
    public NginxHostDTO createHost(CreateNginxHostRequest request) {
        String name = request.name() != null ? request.name() : request.domain();
        String config = generateConfig(request);
        String configPath = SITES_AVAILABLE + "/" + name;

        // 使用 sudo tee 寫入設定檔
        if (!writeFileWithSudo(configPath, config)) {
            log.error("Failed to create host config: {}", name);
            return null;
        }
        log.info("Created nginx config: {}", configPath);

        // 自動啟用
        enableHost(name);

        // 驗證並重載
        String testResult = testConfig();
        if (testResult.contains("syntax is ok")) {
            reload();
        } else {
            log.warn("Config syntax error, not reloading: {}", testResult);
        }

        return getHost(name);
    }

    @Override
    public boolean updateHostConfig(String name, String content) {
        String configPath = SITES_AVAILABLE + "/" + name;
        if (writeFileWithSudo(configPath, content)) {
            log.info("Updated nginx config: {}", name);
            return true;
        }
        log.error("Failed to update config for host: {}", name);
        return false;
    }

    @Override
    public boolean deleteHost(String name) {
        // 先停用
        disableHost(name);

        // 刪除設定檔 (使用 sudo rm)
        String configPath = SITES_AVAILABLE + "/" + name;
        if (!executeCommand("sudo", "rm", "-f", configPath)) {
            log.error("Failed to delete host: {}", name);
            return false;
        }
        log.info("Deleted nginx config: {}", name);

        reload();
        return true;
    }

    @Override
    public boolean enableHost(String name) {
        String available = SITES_AVAILABLE + "/" + name;
        String enabled = SITES_ENABLED + "/" + name;

        if (!Files.exists(Path.of(available))) {
            log.warn("Config not found: {}", available);
            return false;
        }

        // 使用 sudo ln -sf 建立 symlink
        if (Files.exists(Path.of(enabled))) {
            return true; // 已啟用
        }

        if (executeCommand("sudo", "ln", "-sf", available, enabled)) {
            log.info("Enabled host: {}", name);
            return true;
        }
        log.error("Failed to enable host: {}", name);
        return false;
    }

    @Override
    public boolean disableHost(String name) {
        String enabled = SITES_ENABLED + "/" + name;

        if (!Files.exists(Path.of(enabled))) {
            return true; // 已停用
        }

        // 使用 sudo rm 刪除 symlink
        if (executeCommand("sudo", "rm", "-f", enabled)) {
            log.info("Disabled host: {}", name);
            return true;
        }
        log.error("Failed to disable host: {}", name);
        return false;
    }

    // ==================== SSL 憑證管理 ====================

    @Override
    public List<SslCertDTO> listCertificates() {
        List<SslCertDTO> certs = new ArrayList<>();
        Path liveDir = Path.of(CERTBOT_LIVE_DIR);

        if (!Files.exists(liveDir)) {
            return certs;
        }

        try (var stream = Files.list(liveDir)) {
            stream.filter(Files::isDirectory)
                    .forEach(domainDir -> {
                        SslCertDTO cert = parseCertificate(domainDir);
                        if (cert != null) {
                            certs.add(cert);
                        }
                    });
        } catch (IOException e) {
            log.error("Failed to list SSL certificates", e);
        }

        return certs;
    }

    @Override
    public boolean requestCertbotCert(String domain, String email) {
        return executeCommand("sudo", "certbot", "certonly", "--nginx",
                "-d", domain, "--email", email, "--agree-tos", "--non-interactive");
    }

    @Override
    public boolean requestAcmeCert(String domain, String email) {
        return executeCommand("acme.sh", "--issue", "-d", domain, "--nginx",
                "--accountemail", email);
    }

    // ==================== 私有方法 ====================

    private boolean isServiceRunning() {
        try {
            ProcessBuilder pb = new ProcessBuilder("systemctl", "is-active", "nginx");
            Process process = pb.start();
            String output = readProcessOutput(process).trim();
            process.waitFor();
            return "active".equals(output);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isServiceEnabled() {
        try {
            ProcessBuilder pb = new ProcessBuilder("systemctl", "is-enabled", "nginx");
            Process process = pb.start();
            String output = readProcessOutput(process).trim();
            process.waitFor();
            return "enabled".equals(output);
        } catch (Exception e) {
            return false;
        }
    }

    private String getNginxVersion() {
        try {
            ProcessBuilder pb = new ProcessBuilder("nginx", "-v");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String output = readProcessOutput(process).trim();
            process.waitFor();
            // nginx version: nginx/1.24.0
            if (output.contains("nginx/")) {
                return output.substring(output.indexOf("nginx/") + 6).split(" ")[0];
            }
            return output;
        } catch (Exception e) {
            return "unknown";
        }
    }

    private NginxHostDTO parseConfigFile(Path configPath) {
        try {
            String content = Files.readString(configPath);
            String name = configPath.getFileName().toString();
            Path enabledPath = Path.of(SITES_ENABLED, name);
            boolean enabled = Files.exists(enabledPath);

            // 解析 server_name
            String domain = extractValue(content, "server_name\\s+([^;]+);");
            // 解析 listen port
            int port = 80;
            String listenMatch = extractValue(content, "listen\\s+(\\d+)");
            if (listenMatch != null) {
                port = Integer.parseInt(listenMatch);
            }
            // 解析 root
            String root = extractValue(content, "root\\s+([^;]+);");
            // 解析 proxy_pass
            String proxyPass = extractValue(content, "proxy_pass\\s+([^;]+);");
            // 判斷類型
            String type = proxyPass != null ? "proxy" : (content.contains("fastcgi_pass") ? "php" : "static");
            // SSL
            boolean sslEnabled = content.contains("ssl_certificate") || port == 443;
            // gzip
            boolean gzip = content.contains("gzip on");
            // rate limit
            boolean rateLimit = content.contains("limit_req");

            return NginxHostDTO.builder()
                    .name(name)
                    .domain(domain != null ? domain.trim() : name)
                    .port(port)
                    .type(type)
                    .root(root != null ? root.trim() : null)
                    .proxyPass(proxyPass != null ? proxyPass.trim() : null)
                    .sslEnabled(sslEnabled)
                    .enabled(enabled)
                    .configPath(configPath.toString())
                    .gzip(gzip)
                    .rateLimit(rateLimit)
                    .rateLimitRate(null)
                    .aliases(List.of())
                    .build();
        } catch (IOException e) {
            log.error("Failed to parse config: {}", configPath, e);
            return null;
        }
    }

    private String extractValue(String content, String regex) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String generateConfig(CreateNginxHostRequest req) {
        StringBuilder sb = new StringBuilder();
        int port = req.port() != null ? req.port() : 80;
        boolean gzip = req.gzip() != null ? req.gzip() : true;

        sb.append("server {\n");
        sb.append("    listen ").append(port).append(";\n");
        sb.append("    listen [::]:").append(port).append(";\n");
        sb.append("    server_name ").append(req.domain());
        if (req.aliases() != null && !req.aliases().isEmpty()) {
            sb.append(" ").append(String.join(" ", req.aliases()));
        }
        sb.append(";\n\n");

        if ("proxy".equals(req.type())) {
            // Reverse Proxy 設定
            sb.append("    location / {\n");
            sb.append("        proxy_pass ").append(req.proxyPass()).append(";\n");
            sb.append("        proxy_http_version 1.1;\n");
            sb.append("        proxy_set_header Upgrade $http_upgrade;\n");
            sb.append("        proxy_set_header Connection 'upgrade';\n");
            sb.append("        proxy_set_header Host $host;\n");
            sb.append("        proxy_set_header X-Real-IP $remote_addr;\n");
            sb.append("        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n");
            sb.append("        proxy_set_header X-Forwarded-Proto $scheme;\n");
            sb.append("        proxy_cache_bypass $http_upgrade;\n");
            sb.append("    }\n");
        } else {
            // Static / PHP 設定
            sb.append("    root ").append(req.root()).append(";\n");
            sb.append("    index index.html index.htm");
            if ("php".equals(req.type())) {
                sb.append(" index.php");
            }
            sb.append(";\n\n");

            sb.append("    location / {\n");
            sb.append("        try_files $uri $uri/ =404;\n");
            sb.append("    }\n");

            if ("php".equals(req.type())) {
                sb.append("\n    location ~ \\.php$ {\n");
                sb.append("        include snippets/fastcgi-php.conf;\n");
                sb.append("        fastcgi_pass unix:/run/php/php-fpm.sock;\n");
                sb.append("    }\n");
            }
        }

        // Gzip
        if (gzip) {
            sb.append("\n    gzip on;\n");
            sb.append(
                    "    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;\n");
        }

        // Rate Limiting
        if (req.rateLimit() != null && req.rateLimit()) {
            int rate = req.rateLimitRate() != null ? req.rateLimitRate() : 10;
            sb.append("\n    limit_req zone=one burst=").append(rate).append(" nodelay;\n");
        }

        sb.append("}\n");
        return sb.toString();
    }

    private SslCertDTO parseCertificate(Path domainDir) {
        try {
            String domain = domainDir.getFileName().toString();
            Path certPath = domainDir.resolve("fullchain.pem");
            Path keyPath = domainDir.resolve("privkey.pem");

            if (!Files.exists(certPath)) {
                return null;
            }

            // 使用 openssl 取得憑證資訊
            ProcessBuilder pb = new ProcessBuilder("openssl", "x509", "-in",
                    certPath.toString(), "-noout", "-issuer", "-enddate");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String output = readProcessOutput(process);
            process.waitFor();

            String issuer = "Unknown";
            String expireDate = "Unknown";
            int daysRemaining = 0;

            for (String line : output.split("\n")) {
                if (line.startsWith("issuer=")) {
                    // 提取 CN
                    if (line.contains("CN = ")) {
                        issuer = line.substring(line.indexOf("CN = ") + 5).split(",")[0].trim();
                    }
                } else if (line.startsWith("notAfter=")) {
                    // notAfter=Dec 10 00:00:00 2024 GMT
                    String dateStr = line.substring("notAfter=".length()).trim();
                    // 簡化處理：只取日期部分
                    expireDate = dateStr;
                    // 計算剩餘天數 (簡化)
                    daysRemaining = 30; // TODO: 實際計算
                }
            }

            return SslCertDTO.builder()
                    .domain(domain)
                    .issuer(issuer)
                    .expireDate(expireDate)
                    .daysRemaining(daysRemaining)
                    .autoRenew(true)
                    .certPath(certPath.toString())
                    .keyPath(keyPath.toString())
                    .source("certbot")
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse certificate: {}", domainDir, e);
            return null;
        }
    }

    /**
     * 使用 sudo tee 將內容寫入檔案
     */
    private boolean writeFileWithSudo(String filePath, String content) {
        try {
            ProcessBuilder pb = new ProcessBuilder("sudo", "tee", filePath);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 將內容寫入 stdin
            try (OutputStream os = process.getOutputStream()) {
                os.write(content.getBytes());
                os.flush();
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String output = readProcessOutput(process);
                log.error("Failed to write file {}: {}", filePath, output);
            }
            return exitCode == 0;
        } catch (Exception e) {
            log.error("Failed to write file with sudo: {}", filePath, e);
            return false;
        }
    }

    private boolean executeCommand(String... args) {
        try {
            ProcessBuilder pb = new ProcessBuilder(args);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String output = readProcessOutput(process);
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("Command failed with exit code {}: {}", exitCode, output);
            }
            return exitCode == 0;
        } catch (Exception e) {
            log.error("Failed to execute command: {}", String.join(" ", args), e);
            return false;
        }
    }

    private String readProcessOutput(Process process) throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            return sb.toString();
        }
    }
}
