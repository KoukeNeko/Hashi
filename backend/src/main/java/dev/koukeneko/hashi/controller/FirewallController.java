package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.FirewallRuleDTO;
import dev.koukeneko.hashi.service.FirewallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/firewall")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FirewallController {

    private final FirewallService firewallService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getStatus() {
        return ResponseEntity.ok(Map.of("enabled", firewallService.isEnabled()));
    }

    @PostMapping("/status")
    public ResponseEntity<Void> setStatus(@RequestParam boolean enabled) {
        firewallService.setEnabled(enabled);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<FirewallRuleDTO>> getRules() {
        return ResponseEntity.ok(firewallService.getRules());
    }

    @PostMapping("/allow")
    public ResponseEntity<Void> addRule(@RequestParam String port, @RequestParam(defaultValue = "tcp") String protocol) {
        firewallService.addRule(port, protocol);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{index}")
    public ResponseEntity<Void> deleteRule(@PathVariable int index) {
        firewallService.deleteRule(index);
        return ResponseEntity.ok().build();
    }
}
