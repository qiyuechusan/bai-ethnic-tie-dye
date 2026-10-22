package com.baizu.tiedye.atlas.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.atlas.dto.PlaceDto;
import com.baizu.tiedye.atlas.dto.StatsDto;
import com.baizu.tiedye.atlas.entity.MapPlace;
import com.baizu.tiedye.atlas.entity.MapStat;
import com.baizu.tiedye.atlas.repository.MapPlaceRepository;
import com.baizu.tiedye.atlas.repository.MapStatRepository;
import com.baizu.tiedye.common.ApiException;

@Service
@Transactional(readOnly = true)
public class AtlasService {

    private final MapPlaceRepository placeRepository;
    private final MapStatRepository statRepository;

    public AtlasService(MapPlaceRepository placeRepository, MapStatRepository statRepository) {
        this.placeRepository = placeRepository;
        this.statRepository = statRepository;
    }

    public List<PlaceDto> listPlaces() {
        return placeRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(PlaceDto::from)
                .toList();
    }

    public StatsDto stats(String placeId) {
        MapStat stat = statRepository.findById(placeId)
                .orElseThrow(() -> new ApiException(40401, "没有找到该地点的统计数据", HttpStatus.NOT_FOUND));
        MapPlace place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ApiException(40401, "没有找到该地点", HttpStatus.NOT_FOUND));

        return new StatsDto(
                place.getId(),
                place.getName(),
                stat.getWorkers(),
                stat.getWorkshops(),
                stat.getAnnualOutput(),
                "万元",
                stat.getSourceNote(),
                stat.getUpdatedAt()
        );
    }
}
