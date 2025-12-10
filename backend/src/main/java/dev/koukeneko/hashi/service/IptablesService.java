package dev.koukeneko.hashi.service;

import dev.koukeneko.hashi.model.dto.AddIptablesRuleRequest;
import dev.koukeneko.hashi.model.dto.IptablesRuleDTO;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * iptables 管理服務
 * 提供列出、新增、刪除規則的功能
 */
@Service
public class IptablesService {

    private static final String DEFAULT_TABLE = "filter";
    
    // 解析 iptables -L -n -v --line-numbers 輸出的正則表達式
    // 範例行: "1    0     0 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22"
    private static final Pattern RULE_PATTERN = Pattern.compile(
        "^(\\d+)\\s+(\\d+[KMG]?)\\s+(\\d+[KMG]?)\\s+(\\S+)\\s+(\\S+)\\s+--\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)\\s*(.*)$"
    );

    /**
     * 取得指定 table 的所有規則
     * @param table filter / nat / mangle
     * @return 規則列表，依 chain 分組
     */
    public List<IptablesRuleDTO> getRules(String table) {
        if (table == null || table.isBlank()) {
            table = DEFAULT_TABLE;
        }
        
        List<IptablesRuleDTO> rules = new ArrayList<>();
        
        try {
            ProcessBuilder builder = new ProcessBuilder(
                "sudo", "-n", "iptables", "-t", table, "-L", "-n", "-v", "--line-numbers"
            );
            Process process = builder.start();
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            String currentChain = null;
            
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                
                // 解析 chain 標題行: "Chain INPUT (policy ACCEPT 0 packets, 0 bytes)"
                if (line.startsWith("Chain ")) {
                    int spaceIdx = line.indexOf(' ', 6);
                    if (spaceIdx > 0) {
                        currentChain = line.substring(6, spaceIdx);
                    }
                    continue;
                }
                
                // 跳過標題行
                if (line.startsWith("num") || line.startsWith("pkts") || line.isEmpty()) {
                    continue;
                }
                
                // 解析規則行
                if (currentChain != null) {
                    IptablesRuleDTO rule = parseRuleLine(line, table, currentChain);
                    if (rule != null) {
                        rules.add(rule);
                    }
                }
            }
            
            process.waitFor();
        } catch (Exception e) {
            throw new RuntimeException("Failed to list iptables rules: " + e.getMessage(), e);
        }
        
        return rules;
    }

    /**
     * 新增規則
     */
    public void addRule(AddIptablesRuleRequest request) {
        try {
            List<String> command = buildAddCommand(request);
            ProcessBuilder builder = new ProcessBuilder(command);
            Process process = builder.start();
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new RuntimeException("iptables command failed: " + error);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to add iptables rule: " + e.getMessage(), e);
        }
    }

    /**
     * 刪除規則
     * @param table table 名稱
     * @param chain chain 名稱
     * @param lineNumber 規則行號
     */
    public void deleteRule(String table, String chain, int lineNumber) {
        if (table == null || table.isBlank()) {
            table = DEFAULT_TABLE;
        }
        
        try {
            ProcessBuilder builder = new ProcessBuilder(
                "sudo", "-n", "iptables", "-t", table, "-D", chain, String.valueOf(lineNumber)
            );
            Process process = builder.start();
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new RuntimeException("Failed to delete rule: " + error);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete iptables rule: " + e.getMessage(), e);
        }
    }

    /**
     * 保存規則至檔案（使用 iptables-save）
     */
    public void saveRules() {
        try {
            // 嘗試使用 netfilter-persistent 或 iptables-save
            ProcessBuilder builder = new ProcessBuilder(
                "bash", "-c", "sudo -n iptables-save > /etc/iptables/rules.v4 2>/dev/null || sudo -n netfilter-persistent save 2>/dev/null || sudo -n service iptables save 2>/dev/null"
            );
            Process process = builder.start();
            int exitCode = process.waitFor();
            
            // 個別發行版可能會失敗，但只要一種成功就好
            if (exitCode != 0) {
                // 嘗試直接輸出到標準的位置
                builder = new ProcessBuilder("bash", "-c", "sudo -n sh -c 'iptables-save > /etc/iptables.rules'");
                process = builder.start();
                process.waitFor();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to save iptables rules: " + e.getMessage(), e);
        }
    }

    // ==================== Private Helper Methods ====================

    /**
     * 解析單行規則
     */
    private IptablesRuleDTO parseRuleLine(String line, String table, String chain) {
        Matcher matcher = RULE_PATTERN.matcher(line);
        if (!matcher.matches()) {
            return null;
        }
        
        try {
            int lineNumber = Integer.parseInt(matcher.group(1));
            long packetCount = parseCount(matcher.group(2));
            long byteCount = parseCount(matcher.group(3));
            String target = matcher.group(4);
            String protocol = matcher.group(5);
            String inInterface = matcher.group(6);
            String outInterface = matcher.group(7);
            String source = matcher.group(8);
            String destination = matcher.group(9);
            String options = matcher.group(10).trim();
            
            // 解析 options 中的 port 資訊
            Integer sourcePort = extractPort(options, "spt:");
            Integer destPort = extractPort(options, "dpt:");
            
            return IptablesRuleDTO.builder()
                    .lineNumber(lineNumber)
                    .table(table)
                    .chain(chain)
                    .target(target)
                    .protocol(protocol)
                    .source(source)
                    .destination(destination)
                    .inInterface("*".equals(inInterface) ? "" : inInterface)
                    .outInterface("*".equals(outInterface) ? "" : outInterface)
                    .sourcePort(sourcePort)
                    .destPort(destPort)
                    .options(options)
                    .packetCount(packetCount)
                    .byteCount(byteCount)
                    .build();
        } catch (Exception e) {
            // 解析失敗時回傳 null
            return null;
        }
    }

    /**
     * 解析計數器值（支援 K/M/G 後綴）
     */
    private long parseCount(String value) {
        if (value == null || value.isEmpty()) {
            return 0;
        }
        
        value = value.toUpperCase();
        long multiplier = 1;
        
        if (value.endsWith("K")) {
            multiplier = 1000;
            value = value.substring(0, value.length() - 1);
        } else if (value.endsWith("M")) {
            multiplier = 1000000;
            value = value.substring(0, value.length() - 1);
        } else if (value.endsWith("G")) {
            multiplier = 1000000000;
            value = value.substring(0, value.length() - 1);
        }
        
        return Long.parseLong(value) * multiplier;
    }

    /**
     * 從 options 字串中提取 port
     */
    private Integer extractPort(String options, String prefix) {
        if (options == null) {
            return null;
        }
        
        int idx = options.indexOf(prefix);
        if (idx < 0) {
            return null;
        }
        
        StringBuilder portStr = new StringBuilder();
        for (int i = idx + prefix.length(); i < options.length(); i++) {
            char c = options.charAt(i);
            if (Character.isDigit(c)) {
                portStr.append(c);
            } else {
                break;
            }
        }
        
        if (portStr.length() > 0) {
            return Integer.parseInt(portStr.toString());
        }
        return null;
    }

    /**
     * 建構 iptables 新增規則的指令
     */
    private List<String> buildAddCommand(AddIptablesRuleRequest request) {
        List<String> command = new ArrayList<>();
        command.add("sudo");
        command.add("-n");
        command.add("iptables");
        
        // Table
        String table = request.table() != null ? request.table() : DEFAULT_TABLE;
        command.add("-t");
        command.add(table);
        
        // Append or Insert
        if (request.append() == null || request.append()) {
            command.add("-A");
        } else {
            command.add("-I");
        }
        command.add(request.chain());
        
        // Protocol
        if (request.protocol() != null && !request.protocol().isBlank() && !"all".equalsIgnoreCase(request.protocol())) {
            command.add("-p");
            command.add(request.protocol());
        }
        
        // Source
        if (request.source() != null && !request.source().isBlank() && !"0.0.0.0/0".equals(request.source())) {
            command.add("-s");
            command.add(request.source());
        }
        
        // Destination
        if (request.destination() != null && !request.destination().isBlank() && !"0.0.0.0/0".equals(request.destination())) {
            command.add("-d");
            command.add(request.destination());
        }
        
        // In Interface
        if (request.inInterface() != null && !request.inInterface().isBlank()) {
            command.add("-i");
            command.add(request.inInterface());
        }
        
        // Out Interface
        if (request.outInterface() != null && !request.outInterface().isBlank()) {
            command.add("-o");
            command.add(request.outInterface());
        }
        
        // Source Port (需要先指定 protocol)
        if (request.sourcePort() != null) {
            command.add("--sport");
            command.add(String.valueOf(request.sourcePort()));
        }
        
        // Destination Port (需要先指定 protocol)
        if (request.destPort() != null) {
            command.add("--dport");
            command.add(String.valueOf(request.destPort()));
        }
        
        // Target (必須)
        command.add("-j");
        command.add(request.target());
        
        return command;
    }
}
