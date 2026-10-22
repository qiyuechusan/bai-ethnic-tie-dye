package com.baizu.tiedye.auth.dto;

import com.baizu.tiedye.auth.entity.AppUser;

public record UserDto(Long id, String displayName, String account) {

    public static UserDto from(AppUser user) {
        return new UserDto(user.getId(), user.getDisplayName(), user.getAccount());
    }
}
