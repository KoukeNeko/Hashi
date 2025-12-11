package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 認證請求 DTO
 *
 * @param username
 *            使用者名稱
 * @param password
 *            密碼
 */
@Builder
public record AuthRequestDTO(
        String username,
        String password) {
}
