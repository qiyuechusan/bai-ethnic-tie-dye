package com.baizu.tiedye.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.auth.dto.LoginRequest;
import com.baizu.tiedye.auth.dto.LoginSession;
import com.baizu.tiedye.auth.dto.RegisterRequest;
import com.baizu.tiedye.auth.dto.SessionDto;
import com.baizu.tiedye.auth.dto.UserDto;
import com.baizu.tiedye.auth.entity.AppUser;
import com.baizu.tiedye.auth.entity.UserSession;
import com.baizu.tiedye.auth.repository.AppUserRepository;
import com.baizu.tiedye.auth.repository.UserSessionRepository;
import com.baizu.tiedye.common.ApiException;

@Service
public class AuthService {

    private static final Duration DEFAULT_TTL = Duration.ofDays(7);
    private static final Duration REMEMBER_TTL = Duration.ofDays(30);
    private static final Pattern ACCOUNT_PATTERN =
            Pattern.compile("^1[3-9]\\d{9}$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppUserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AppUserRepository userRepository,
                       UserSessionRepository sessionRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDto register(RegisterRequest request) {
        String displayName = request.displayName().trim();
        String account = normalizeAccount(request.account());

        if (displayName.length() < 2 || displayName.length() > 20) {
            throw new ApiException(40001, "昵称需要 2–20 个字符", HttpStatus.BAD_REQUEST);
        }
        if (!ACCOUNT_PATTERN.matcher(account).matches()) {
            throw new ApiException(40001, "请输入有效的手机号或邮箱", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByAccount(account)) {
            throw new ApiException(40901, "该账号已经注册，请直接登录", HttpStatus.CONFLICT);
        }

        AppUser user = new AppUser();
        user.setDisplayName(displayName);
        user.setAccount(account);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public LoginSession login(LoginRequest request) {
        String account = normalizeAccount(request.account());
        AppUser user = userRepository.findByAccount(account)
                .orElseThrow(() -> new ApiException(40101, "账号或密码不正确；首次使用请先注册", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(40101, "账号或密码不正确；首次使用请先注册", HttpStatus.UNAUTHORIZED);
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        sessionRepository.deleteByExpiresAtBefore(Instant.now());

        Duration ttl = Boolean.TRUE.equals(request.remember()) ? REMEMBER_TTL : DEFAULT_TTL;
        String token = newToken();
        UserSession session = new UserSession();
        session.setTokenHash(hashToken(token));
        session.setUserId(user.getId());
        session.setExpiresAt(Instant.now().plus(ttl));
        sessionRepository.save(session);

        return new LoginSession(UserDto.from(user), token, ttl.getSeconds());
    }

    @Transactional(readOnly = true)
    public SessionDto session(String token, boolean guest) {
        if (token != null && !token.isBlank()) {
            UserSession session = sessionRepository
                    .findByTokenHashAndExpiresAtAfter(hashToken(token), Instant.now())
                    .orElse(null);
            if (session != null) {
                return userRepository.findById(session.getUserId())
                        .map(user -> SessionDto.user(UserDto.from(user)))
                        .orElseGet(guest ? SessionDto::guest : SessionDto::anonymous);
            }
        }
        return guest ? SessionDto.guest() : SessionDto.anonymous();
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sessionRepository.deleteByTokenHash(hashToken(token));
        }
    }

    private String normalizeAccount(String account) {
        return account == null ? "" : account.trim().toLowerCase(Locale.ROOT);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 不可用", ex);
        }
    }
}
