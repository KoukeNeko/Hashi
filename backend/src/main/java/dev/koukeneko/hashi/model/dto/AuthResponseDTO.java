package dev.koukeneko.hashi.model.dto;

import lombok.Builder;

/**
 * 認證回應 DTO
 *
 * @param success 是否成功
 * @param message 回應訊息
 * @param user    使用者資訊 (成功時)
 */
@Builder
public record AuthResponseDTO(
                boolean success,
                String message,
                UserInfoDTO user) {
}
