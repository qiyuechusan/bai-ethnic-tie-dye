package com.baizu.tiedye.pattern.dto;

import com.baizu.tiedye.pattern.entity.Pattern;

public record PatternDto(
        Long id,
        String name,
        String imageUrl,
        String meaning,
        String category,
        String description,
        Integer sortOrder
) {

    public static PatternDto from(Pattern pattern) {
        return new PatternDto(
                pattern.getId(),
                pattern.getName(),
                pattern.getImageUrl(),
                pattern.getMeaning(),
                pattern.getCategory(),
                pattern.getDescription(),
                pattern.getSortOrder()
        );
    }
}
