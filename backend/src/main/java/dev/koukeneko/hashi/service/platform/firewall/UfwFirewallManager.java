package dev.koukeneko.hashi.service.platform.firewall;

import dev.koukeneko.hashi.model.dto.FirewallRuleDTO;

import java.util.List;

/**
 * UFW 風格防火牆管理介面 Linux: ufw Windows: Windows Firewall (netsh advfirewall)
 */
public interface UfwFirewallManager {

    /**
     * 取得防火牆狀態
     */
    boolean isEnabled();

    /**
     * 啟用/停用防火牆
     */
    void setEnabled(boolean enabled);

    /**
     * 讀取規則列表
     */
    List<FirewallRuleDTO> getRules();

    /**
     * 新增規則 (Allow Port)
     */
    void addRule(String port, String protocol);

    /**
     * 刪除規則
     */
    void deleteRule(int index);
}
