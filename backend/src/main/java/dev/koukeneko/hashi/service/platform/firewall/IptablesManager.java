package dev.koukeneko.hashi.service.platform.firewall;

import dev.koukeneko.hashi.model.dto.AddIptablesRuleRequest;
import dev.koukeneko.hashi.model.dto.IptablesRuleDTO;

import java.util.List;

/**
 * iptables 風格防火牆管理介面 Linux: iptables Windows: 不適用 (可使用 Windows Firewall with Advanced Security)
 */
public interface IptablesManager {

    /**
     * 取得指定 table 的所有規則
     *
     * @param table
     *            filter / nat / mangle
     */
    List<IptablesRuleDTO> getRules(String table);

    /**
     * 新增規則
     */
    void addRule(AddIptablesRuleRequest request);

    /**
     * 刪除規則
     *
     * @param table
     *            table 名稱
     * @param chain
     *            chain 名稱
     * @param lineNumber
     *            規則行號
     */
    void deleteRule(String table, String chain, int lineNumber);

    /**
     * 保存規則至檔案
     */
    void saveRules();
}
