package com.baizu.tiedye.diy.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.common.ApiResponse;
import com.baizu.tiedye.diy.dto.DiyMethodDto;
import com.baizu.tiedye.diy.service.DiyService;

@RestController
@RequestMapping("/api/diy")
public class DiyController {

    private final DiyService diyService;

    public DiyController(DiyService diyService) {
        this.diyService = diyService;
    }

    @GetMapping("/methods")
    public ApiResponse<List<DiyMethodDto>> methods() {
        return ApiResponse.ok(diyService.listMethods());
    }
}
