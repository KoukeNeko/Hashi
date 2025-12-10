package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.AddIptablesRuleRequest;
import dev.koukeneko.hashi.model.dto.IptablesRuleDTO;
import dev.koukeneko.hashi.service.IptablesService;
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

    private final IptablesService iptablesService;

    /**
     * 取得指定 table 的規則列表
     * @param table filter / nat / mangle (預設 filter)
     */
    @GetMapping
    public ResponseEntity<List<IptablesRuleDTO>> getRules(
            @RequestParam(defaultValue = "filter") String table) {
        return ResponseEntity.ok(iptablesService.getRules(table));
    }

    /**
     * 新增規則
     */
    @PostMapping
    public ResponseEntity<Void> addRule(@RequestBody AddIptablesRuleRequest request) {
        iptablesService.addRule(request);
        return ResponseEntity.ok().build();
    }

    /**
     * 刪除規則
     * @param table table 名稱
     * @param chain chain 名稱
     * @param lineNumber 規則行號
     */
    @DeleteMapping("/{table}/{chain}/{lineNumber}")
    public ResponseEntity<Void> deleteRule(
            @PathVariable String table,
            @PathVariable String chain,
            @PathVariable int lineNumber) {
        iptablesService.deleteRule(table, chain, lineNumber);
        return ResponseEntity.ok().build();
    }

    /**
     * 保存規則（持久化）
     */
    @PostMapping("/save")
    public ResponseEntity<Void> saveRules() {
        iptablesService.saveRules();
        return ResponseEntity.ok().build();
    }
}
