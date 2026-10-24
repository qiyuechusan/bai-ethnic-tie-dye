package com.baizu.tiedye.auth.interceptor;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.baizu.tiedye.auth.dto.SessionDto;
import com.baizu.tiedye.auth.service.AuthService;
import com.baizu.tiedye.common.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 模块 5/6 的登录门槛：页面未登录跳转登录页，接口未登录返回 401。
 * 通过 app.auth.require-login 控制，测试环境可关闭。
 */
@Component
public class LoginRequiredInterceptor implements HandlerInterceptor {

    private static final String SESSION_COOKIE = "lanbai_session";

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Value("${app.auth.require-login:true}")
    private boolean requireLogin;

    public LoginRequiredInterceptor(AuthService authService, ObjectMapper objectMapper) {
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!requireLogin || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String token = cookie(request, SESSION_COOKIE);
        SessionDto session = authService.session(token, false);
        if ("user".equals(session.role())) {
            return true;
        }

        if (request.getRequestURI().startsWith("/api/")) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.error(40101, "请先登录")));
            return false;
        }
        response.sendRedirect("/index.html?loginRequired=1");
        return false;
    }

    private static String cookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
