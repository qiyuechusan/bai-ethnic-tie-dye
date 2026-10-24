package com.baizu.tiedye.rag.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baizu.tiedye.ai.config.AiProperties;
import com.baizu.tiedye.common.ApiException;
import com.baizu.tiedye.common.ApiResponse;
import com.baizu.tiedye.rag.ingest.RagKnowledgeSeeder;

@RestController
@RequestMapping("/api/admin/rag")
public class RagAdminController {

    private final RagKnowledgeSeeder seeder;
    private final AiProperties properties;

    public RagAdminController(RagKnowledgeSeeder seeder, AiProperties properties) {
        this.seeder = seeder;
        this.properties = properties;
    }

    @PostMapping("/reindex")
    public ApiResponse<RagKnowledgeSeeder.SeedResult> reindex(
            @RequestHeader(value = "X-Reindex-Token", required = false) String token) {
        String expected = properties.getReindexToken();
        if (expected == null || expected.isBlank()) {
            throw new ApiException(40301, "未配置 RAG_REINDEX_TOKEN，重建接口已禁用", HttpStatus.FORBIDDEN);
        }
        if (!expected.equals(token)) {
            throw new ApiException(40301, "重建令牌不正确", HttpStatus.FORBIDDEN);
        }
        return ApiResponse.ok(seeder.reindex(true));
    }
}
