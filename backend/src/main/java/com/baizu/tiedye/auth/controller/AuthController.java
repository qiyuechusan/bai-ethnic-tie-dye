package com.baizu.tiedye.auth.controller;

import java.time.Duration;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.auth.dto.LoginRequest;
import com.baizu.tiedye.auth.dto.LoginSession;
import com.baizu.tiedye.auth.dto.RegisterRequest;
import com.baizu.tiedye.auth.dto.SessionDto;
import com.baizu.tiedye.auth.dto.UserDto;
import com.baizu.tiedye.auth.service.AuthService;
import com.baizu.tiedye.common.ApiResponse;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class AuthController {

    private static final String SESSION_COOKIE = "lanbai_session";
    private static final String GUEST_COOKIE = "lanbai_guest";
    private static final Duration GUEST_TTL = Duration.ofDays(7);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(authService.register(request)));
    }

    @PostMapping("/login")
    public ApiResponse<UserDto> login(@Valid @RequestBody LoginRequest request,
                                      HttpServletResponse response) {
        LoginSession session = authService.login(request);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(SESSION_COOKIE, session.token(),
                Duration.ofSeconds(session.maxAgeSeconds())).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(GUEST_COOKIE).toString());
        return ApiResponse.ok(session.user());
    }

    @GetMapping("/session")
    public ApiResponse<SessionDto> session(
            @CookieValue(value = SESSION_COOKIE, required = false) String token,
            @CookieValue(value = GUEST_COOKIE, required = false) String guest) {
        return ApiResponse.ok(authService.session(token, "1".equals(guest)));
    }

    @PostMapping("/guest")
    public ApiResponse<Map<String, String>> guest(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(GUEST_COOKIE, "1", GUEST_TTL).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(SESSION_COOKIE).toString());
        return ApiResponse.ok(Map.of("role", "guest"));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @CookieValue(value = SESSION_COOKIE, required = false) String token,
            HttpServletResponse response) {
        authService.logout(token);
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(SESSION_COOKIE).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(GUEST_COOKIE).toString());
        return ApiResponse.ok(null);
    }

    private ResponseCookie cookie(String name, String value, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie clearCookie(String name) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}
