package com.baizu.tiedye.pattern.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.common.ApiResponse;
import com.baizu.tiedye.pattern.dto.PatternDto;
import com.baizu.tiedye.pattern.service.PatternService;

@RestController
@RequestMapping("/api/patterns")
public class PatternController {

    private final PatternService patternService;

    public PatternController(PatternService patternService) {
        this.patternService = patternService;
    }

    @GetMapping
    public ApiResponse<List<PatternDto>> list() {
        return ApiResponse.ok(patternService.listAll());
    }
}
