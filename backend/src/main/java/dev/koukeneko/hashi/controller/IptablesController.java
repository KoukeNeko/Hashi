package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.AddIptablesRuleRequest;
import dev.koukeneko.hashi.model.dto.IptablesRuleDTO;
import dev.koukeneko.hashi.service.platform.firewall.IptablesManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * iptables 管理 REST API
 */
@RestController
@RequestMapping("/api/v1/iptables")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IptablesController {

    private final IptablesManager iptablesManager;

    /**
     * 取得指定表格的 iptables 規則列表
     *
     * @param table
     *            表格名稱，例如: filter, nat, mangle (預設為 filter)
     * @return 規則列表
     */
    @GetMapping
    public ResponseEntity<List<IptablesRuleDTO>> getRules(
            @RequestParam(defaultValue = "filter") String table) {
        return ResponseEntity.ok(iptablesManager.getRules(table));
    }

    /**
     * 新增 iptables 規則
     *
     * @param request
     *            新增規則請求參數
     * @return 成功回傳 200 OK
     */
    @PostMapping
    public ResponseEntity<Void> addRule(@RequestBody AddIptablesRuleRequest request) {
        iptablesManager.addRule(request);
        return ResponseEntity.ok().build();
    }

    /**
     * 刪除 iptables 規則
     *
     * @param table
     *            表格名稱
     * @param chain
     *            鏈名稱
     * @param lineNumber
     *            規則行號
     * @return 成功回傳 200 OK
     */
    @DeleteMapping("/{table}/{chain}/{lineNumber}")
    public ResponseEntity<Void> deleteRule(
            @PathVariable String table,
            @PathVariable String chain,
            @PathVariable int lineNumber) {
        iptablesManager.deleteRule(table, chain, lineNumber);
        return ResponseEntity.ok().build();
    }

    /**
     * 保存 iptables 規則至系統檔 (持久化)
     *
     * @return 成功回傳 200 OK
     */
    @PostMapping("/save")
    public ResponseEntity<Void> saveRules() {
        iptablesManager.saveRules();
        return ResponseEntity.ok().build();
    }
}
