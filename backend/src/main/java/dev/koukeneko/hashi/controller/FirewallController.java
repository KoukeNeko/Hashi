package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.FirewallRuleDTO;
import dev.koukeneko.hashi.service.platform.firewall.UfwFirewallManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * UFW 防火牆管理 Controller 提供防火牆狀態控制與規則管理
 */
@RestController
@RequestMapping("/api/v1/firewall")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FirewallController {

    private final UfwFirewallManager firewallManager;

    /**
     * 取得防火牆啟用狀態
     *
     * @return 包含 enabled 狀態的 Map
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getStatus() {
        return ResponseEntity.ok(Map.of("enabled", firewallManager.isEnabled()));
    }

    /**
     * 設定防火牆啟用狀態
     *
     * @param enabled
     *            是否啟用
     * @return 成功回傳 200 OK
     */
    @PostMapping("/status")
    public ResponseEntity<Void> setStatus(@RequestParam boolean enabled) {
        firewallManager.setEnabled(enabled);
        return ResponseEntity.ok().build();
    }

    /**
     * 取得已設定的防火牆規則列表
     *
     * @return 規則列表
     */
    @GetMapping
    public ResponseEntity<List<FirewallRuleDTO>> getRules() {
        return ResponseEntity.ok(firewallManager.getRules());
    }

    /**
     * 新增允許連線規則
     *
     * @param port
     *            通訊埠
     * @param protocol
     *            協定 (tcp/udp)
     * @return 成功回傳 200 OK
     */
    @PostMapping("/allow")
    public ResponseEntity<Void> addRule(@RequestParam String port,
            @RequestParam(defaultValue = "tcp") String protocol) {
        firewallManager.addRule(port, protocol);
        return ResponseEntity.ok().build();
    }

    /**
     * 刪除指定防火牆規則
     *
     * @param index
     *            規則索引
     * @return 成功回傳 200 OK
     */
    @DeleteMapping("/{index}")
    public ResponseEntity<Void> deleteRule(@PathVariable int index) {
        firewallManager.deleteRule(index);
        return ResponseEntity.ok().build();
    }
}
