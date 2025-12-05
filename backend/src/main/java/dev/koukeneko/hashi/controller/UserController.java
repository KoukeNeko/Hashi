package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.UserInfoDTO;
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
    public ResponseEntity<List<UserInfoDTO>> listUsers() {
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

    @PostMapping("/groups")
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody Map<String, String> request) {
        String groupName = request.get("name");
        if (groupName == null || groupName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Group name is required"));
        }
        boolean success = userService.createGroup(groupName);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Group created successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to create group"));
        }
    }

    @DeleteMapping("/groups/{groupName}")
    public ResponseEntity<Map<String, Object>> deleteGroup(@PathVariable String groupName) {
        boolean success = userService.deleteGroup(groupName);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Group deleted successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to delete group"));
        }
    }

    @PostMapping("/groups/{groupName}/members")
    public ResponseEntity<Map<String, Object>> addMemberToGroup(
            @PathVariable String groupName,
            @RequestBody Map<String, String> request) {
        String username = request.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username is required"));
        }
        boolean success = userService.addMemberToGroup(groupName, username);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Member added successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to add member"));
        }
    }

    @DeleteMapping("/groups/{groupName}/members/{username}")
    public ResponseEntity<Map<String, Object>> removeMemberFromGroup(
            @PathVariable String groupName,
            @PathVariable String username) {
        boolean success = userService.removeMemberFromGroup(groupName, username);
        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Member removed successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to remove member"));
        }
    }
}
