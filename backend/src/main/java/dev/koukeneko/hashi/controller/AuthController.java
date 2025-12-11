package dev.koukeneko.hashi.controller;

import dev.koukeneko.hashi.model.dto.AuthRequestDTO;
import dev.koukeneko.hashi.model.dto.AuthResponseDTO;
import dev.koukeneko.hashi.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 認證相關 Controller 處理登入、登出及 Session 驗證
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 使用者登入
     *
     * @param request
     *            包含使用者名稱與密碼的請求物件
     * @return 登入成功回傳使用者資訊與 Token (目前無 Token)，失敗回傳 401
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody AuthRequestDTO request) {
        return authService.authenticate(request.username(), request.password())
                .map(user -> ResponseEntity.ok(new AuthResponseDTO(true, "Login successful", user)))
                .orElse(ResponseEntity.status(401).body(new AuthResponseDTO(false, "Invalid credentials", null)));
    }

    /**
     * 使用者登出
     * <p>
     * 由於使用 localStorage 儲存 Session，後端主要負責記錄登出日誌或清除 Server 端 Session (若有)
     * </p>
     *
     * @return 登出成功訊息
     */
    @PostMapping("/logout")
    public ResponseEntity<AuthResponseDTO> logout() {
        // 由於使用 localStorage，登出主要由前端處理
        return ResponseEntity.ok(new AuthResponseDTO(true, "Logged out successfully", null));
    }

    /**
     * 驗證 Session 有效性
     *
     * @param username
     *            使用者名稱
     * @return 驗證成功回傳使用者資訊，失敗回傳 401
     */
    @GetMapping("/validate")
    public ResponseEntity<AuthResponseDTO> validateSession(@RequestParam String username) {
        // 驗證使用者是否仍然有效（存在於系統中）
        return authService.validateUser(username)
                .map(user -> ResponseEntity.ok(new AuthResponseDTO(true, "Session valid", user)))
                .orElse(ResponseEntity.status(401).body(new AuthResponseDTO(false, "Invalid session", null)));
    }
}
