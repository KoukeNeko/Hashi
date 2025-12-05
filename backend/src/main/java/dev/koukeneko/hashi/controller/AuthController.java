package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.AuthRequest;
import dev.koukeneko.hashi.model.dto.AuthResponse;
import dev.koukeneko.hashi.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return authService.authenticate(request.getUsername(), request.getPassword())
                .map(user -> ResponseEntity.ok(new AuthResponse(true, "Login successful", user)))
                .orElse(ResponseEntity.status(401).body(new AuthResponse(false, "Invalid credentials", null)));
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout() {
        // 由於使用 localStorage，登出主要由前端處理
        return ResponseEntity.ok(new AuthResponse(true, "Logged out successfully", null));
    }

    @GetMapping("/validate")
    public ResponseEntity<AuthResponse> validateSession(@RequestParam String username) {
        // 驗證用戶是否仍然有效（存在於系統中）
        return authService.validateUser(username)
                .map(user -> ResponseEntity.ok(new AuthResponse(true, "Session valid", user)))
                .orElse(ResponseEntity.status(401).body(new AuthResponse(false, "Invalid session", null)));
    }
}
