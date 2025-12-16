package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.DatabaseDTO;
import dev.koukeneko.hashi.service.DatabaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/databases")
@RequiredArgsConstructor
public class DatabaseController {

    private final DatabaseService databaseService;

    @GetMapping
    public ResponseEntity<List<DatabaseDTO>> listDatabases() {
        return ResponseEntity.ok(databaseService.listDatabases());
    }

    @PostMapping
    public ResponseEntity<Void> createDatabase(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String type = payload.get("type");
        if (name == null || type == null) {
            return ResponseEntity.badRequest().build();
        }
        databaseService.createDatabase(name, type);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{type}/{name}")
    public ResponseEntity<Void> removeDatabase(@PathVariable String type, @PathVariable String name) {
        databaseService.removeDatabase(name, type);
        return ResponseEntity.ok().build();
    }
}
