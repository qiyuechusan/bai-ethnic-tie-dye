package com.baizu.tiedye.artwork.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.baizu.tiedye.artwork.dto.ArtworkDto;
import com.baizu.tiedye.artwork.service.ArtworkService;
import com.baizu.tiedye.common.ApiResponse;

@RestController
@RequestMapping("/api/artworks")
public class ArtworkController {

    private final ArtworkService artworkService;

    public ArtworkController(ArtworkService artworkService) {
        this.artworkService = artworkService;
    }

    @GetMapping
    public ApiResponse<List<ArtworkDto>> list() {
        return ApiResponse.ok(artworkService.listApproved());
    }

    @PostMapping("/upload")
    public ApiResponse<ArtworkDto> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("tieMethod") String tieMethod,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "authorName", required = false) String authorName) {
        return ApiResponse.ok(artworkService.upload(file, title, tieMethod, description, authorName));
    }

    @PostMapping("/{id}/like")
    public ApiResponse<Map<String, Object>> like(@PathVariable Long id) {
        return ApiResponse.ok(artworkService.like(id));
    }
}
