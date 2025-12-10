package dev.koukeneko.hashi.service.platform.firewall;

import dev.koukeneko.hashi.model.dto.FirewallRuleDTO;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Linux UFW 防火牆管理實作
 */
@Slf4j
public class LinuxUfwFirewallManager implements UfwFirewallManager {

    @Override
    public boolean isEnabled() {
        try {
            ProcessBuilder builder = new ProcessBuilder("sudo", "-n", "ufw", "status");
            Process process = builder.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line = reader.readLine();
            process.waitFor();

            // 輸出範例: "Status: active" 或 "Status: inactive"
            return line != null && line.toLowerCase().contains("active") && !line.toLowerCase().contains("inactive");
        } catch (Exception e) {
            log.error("Failed to check UFW status", e);
            return false;
        }
    }

    @Override
    public void setEnabled(boolean enabled) {
        try {
            String action = enabled ? "enable" : "disable";
            // 使用 yes | 來自動回答確認提示
            ProcessBuilder builder = new ProcessBuilder("bash", "-c", "yes | sudo -n ufw " + action);
            Process process = builder.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new RuntimeException("Failed to " + action + " firewall: " + error);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to change firewall status", e);
        }
    }

    @Override
    public List<FirewallRuleDTO> getRules() {
        List<FirewallRuleDTO> rules = new ArrayList<>();
        try {
            ProcessBuilder builder = new ProcessBuilder("sudo", "-n", "ufw", "status", "numbered");
            Process process = builder.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;

            // 解析邏輯
            // 範例輸出: [ 1] 22/tcp ALLOW IN Anywhere
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // 必須以 "[" 開頭才是有編號的規則行
                if (!line.startsWith("["))
                    continue;

                // 移除中括號，把 "[ 1]" 變成 "1"
                String cleanLine = line.replaceAll("^\\[\\s*(\\d+)\\]", "$1");

                // 用 "至少兩個空格" 來切割欄位，避免切到單一空格
                String[] parts = cleanLine.split("\\s{2,}");

                if (parts.length >= 4) {
                    rules.add(FirewallRuleDTO.builder()
                            .index(Integer.parseInt(parts[0].trim()))
                            .to(parts[1].trim())
                            .action(parts[2].trim())
                            .from(parts[3].trim())
                            .ipv6(parts[3].contains("(v6)"))
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to get UFW rules", e);
        }
        return rules;
    }

    @Override
    public void addRule(String port, String protocol) {
        try {
            String rule = port + (protocol.isEmpty() ? "" : "/" + protocol);
            new ProcessBuilder("sudo", "-n", "ufw", "allow", rule).start().waitFor();
        } catch (Exception e) {
            throw new RuntimeException("Failed to add rule", e);
        }
    }

    @Override
    public void deleteRule(int index) {
        try {
            // --force 是為了跳過 "y/n" 確認提示
            new ProcessBuilder("sudo", "-n", "ufw", "--force", "delete", String.valueOf(index)).start().waitFor();
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete rule", e);
        }
    }
}
