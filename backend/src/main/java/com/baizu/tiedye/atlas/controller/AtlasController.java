package com.baizu.tiedye.atlas.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.atlas.dto.PlaceDto;
import com.baizu.tiedye.atlas.dto.StatsDto;
import com.baizu.tiedye.atlas.service.AtlasService;
import com.baizu.tiedye.common.ApiResponse;

@RestController
@RequestMapping("/api/map")
public class AtlasController {

    private final AtlasService atlasService;

    public AtlasController(AtlasService atlasService) {
        this.atlasService = atlasService;
    }

    @GetMapping("/places")
    public ApiResponse<List<PlaceDto>> places() {
        return ApiResponse.ok(atlasService.listPlaces());
    }

    @GetMapping("/stats")
    public ApiResponse<StatsDto> stats(@RequestParam("place") String place) {
        return ApiResponse.ok(atlasService.stats(place));
    }
}
