package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.AuthRequestDTO;
import dev.koukeneko.hashi.model.dto.AuthResponseDTO;
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
    public ResponseEntity<AuthResponseDTO> login(@RequestBody AuthRequestDTO request) {
        return authService.authenticate(request.username(), request.password())
                .map(user -> ResponseEntity.ok(new AuthResponseDTO(true, "Login successful", user)))
                .orElse(ResponseEntity.status(401).body(new AuthResponseDTO(false, "Invalid credentials", null)));
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponseDTO> logout() {
        // 由於使用 localStorage，登出主要由前端處理
        return ResponseEntity.ok(new AuthResponseDTO(true, "Logged out successfully", null));
    }

    @GetMapping("/validate")
    public ResponseEntity<AuthResponseDTO> validateSession(@RequestParam String username) {
        // 驗證使用者是否仍然有效（存在於系統中）
        return authService.validateUser(username)
                .map(user -> ResponseEntity.ok(new AuthResponseDTO(true, "Session valid", user)))
                .orElse(ResponseEntity.status(401).body(new AuthResponseDTO(false, "Invalid session", null)));
    }
}
