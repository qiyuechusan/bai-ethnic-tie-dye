package com.baizu.tiedye.auth.dto;

public record SessionDto(String role, UserDto user) {

    public static SessionDto anonymous() {
        return new SessionDto("anonymous", null);
    }

    public static SessionDto guest() {
        return new SessionDto("guest", null);
    }

    public static SessionDto user(UserDto user) {
        return new SessionDto("user", user);
    }
}
