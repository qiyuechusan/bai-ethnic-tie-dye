package com.baizu.tiedye.artwork.dto;

import java.time.Instant;

import com.baizu.tiedye.artwork.entity.Artwork;

public record ArtworkDto(
        Long id,
        String title,
        String imageUrl,
        String description,
        String tieMethod,
        String authorName,
        Integer status,
        Integer likes,
        Instant createdAt
) {

    public static ArtworkDto from(Artwork artwork) {
        return new ArtworkDto(
                artwork.getId(),
                artwork.getTitle(),
                artwork.getImageUrl(),
                artwork.getDescription(),
                artwork.getTieMethod(),
                artwork.getAuthorName(),
                artwork.getStatus(),
                artwork.getLikes(),
                artwork.getCreatedAt()
        );
    }
}
