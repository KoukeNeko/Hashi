package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.UserInfo;
import dev.koukeneko.hashi.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserInfo>> listUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String shell = request.getOrDefault("shell", "/bin/bash");
        boolean createHome = Boolean.parseBoolean(request.getOrDefault("createHome", "true"));

        boolean success = userService.createUser(username, password, shell, createHome);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "User created successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to create user"));
        }
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<Map<String, Object>> deleteUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "false") boolean removeHome) {
        boolean success = userService.deleteUser(username, removeHome);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to delete user"));
        }
    }

    @PutMapping("/{username}/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String newPassword = request.get("password");
        boolean success = userService.changePassword(username, newPassword);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to change password"));
        }
    }

    @PutMapping("/{username}/shell")
    public ResponseEntity<Map<String, Object>> changeShell(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        String newShell = request.get("shell");
        boolean success = userService.changeShell(username, newShell);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Shell changed successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to change shell"));
        }
    }

    @GetMapping("/groups")
    public ResponseEntity<List<Map<String, Object>>> listGroups() {
        return ResponseEntity.ok(userService.listAllGroups());
    }

    @GetMapping("/{username}/groups")
    public ResponseEntity<List<String>> getUserGroups(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserGroups(username));
    }

    @PutMapping("/{username}/groups")
    public ResponseEntity<Map<String, Object>> setUserGroups(
            @PathVariable String username,
            @RequestBody Map<String, List<String>> request) {
        List<String> groups = request.get("groups");
        boolean success = userService.setUserGroups(username, groups);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Groups updated successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to update groups"));
        }
    }
}
