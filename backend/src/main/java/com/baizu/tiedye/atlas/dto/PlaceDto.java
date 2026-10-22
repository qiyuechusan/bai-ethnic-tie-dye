package com.baizu.tiedye.atlas.dto;

import java.math.BigDecimal;

import com.baizu.tiedye.atlas.entity.MapPlace;

public record PlaceDto(
        String id,
        String name,
        String kicker,
        String lead,
        String highlight,
        String person,
        String currentState,
        String note,
        String photo,
        BigDecimal latitude,
        BigDecimal longitude,
        BigDecimal mapX,
        BigDecimal mapY,
        BigDecimal mapScale
) {

    public static PlaceDto from(MapPlace place) {
        return new PlaceDto(
                place.getId(),
                place.getName(),
                place.getKicker(),
                place.getLead(),
                place.getHighlight(),
                place.getPerson(),
                place.getCurrentState(),
                place.getNote(),
                place.getPhoto(),
                place.getLatitude(),
                place.getLongitude(),
                place.getMapX(),
                place.getMapY(),
                place.getMapScale()
        );
    }
}
