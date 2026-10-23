package com.baizu.tiedye.auth.dto;

/**
 * 登录成功后的结果：返回给 Controller 设置 Cookie，不直接暴露给前端。
 */
public record LoginSession(UserDto user, String token, long maxAgeSeconds) {
}
