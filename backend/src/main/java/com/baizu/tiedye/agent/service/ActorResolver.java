package com.baizu.tiedye.agent.service;

import org.springframework.stereotype.Component;

import com.baizu.tiedye.auth.dto.SessionDto;
import com.baizu.tiedye.auth.service.AuthService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 识别当前学习者：登录用户用 u:{id}，访客用 s:{sessionKey}。
 * 不修改现有登录 Cookie 逻辑，只读。
 */
@Component
public class ActorResolver {

    private static final String SESSION_COOKIE = "lanbai_session";
    private static final String GUEST_COOKIE = "lanbai_guest";

    private final AuthService authService;

    public ActorResolver(AuthService authService) {
        this.authService = authService;
    }

    public Actor resolve(HttpServletRequest request, String sessionKey) {
        String token = cookie(request, SESSION_COOKIE);
        String guest = cookie(request, GUEST_COOKIE);
        SessionDto session = authService.session(token, "1".equals(guest));
        Long userId = session.user() == null ? null : session.user().id();
        String actorKey = userId == null ? "s:" + sessionKey : "u:" + userId;
        return new Actor(userId, actorKey, sessionKey);
    }

    private static String cookie(HttpServletRequest request, String name) {
        if (request == null || request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    public record Actor(Long userId, String actorKey, String sessionKey) {
    }
}
