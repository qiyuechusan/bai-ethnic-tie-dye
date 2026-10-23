package com.baizu.tiedye.diy.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.diy.dto.DiyMethodDto;
import com.baizu.tiedye.diy.entity.DyeTieMethod;
import com.baizu.tiedye.diy.repository.DyeTieMethodRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@Transactional(readOnly = true)
public class DiyService {

    private static final Logger log = LoggerFactory.getLogger(DiyService.class);
    private static final TypeReference<List<String>> COLOR_LIST = new TypeReference<>() { };

    private final DyeTieMethodRepository methodRepository;
    private final ObjectMapper objectMapper;

    public DiyService(DyeTieMethodRepository methodRepository, ObjectMapper objectMapper) {
        this.methodRepository = methodRepository;
        this.objectMapper = objectMapper;
    }

    public List<DiyMethodDto> listMethods() {
        return methodRepository.findByEnabledTrueOrderBySortOrderAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    private DiyMethodDto toDto(DyeTieMethod method) {
        JsonNode params = readParams(method.getParams());
        List<String> colors = readColors(method.getPreviewColors());
        return new DiyMethodDto(
                method.getId(),
                method.getCode(),
                method.getName(),
                method.getSubtitle(),
                method.getDescription(),
                method.getPatternType(),
                method.getDifficulty(),
                params,
                colors,
                method.getSortOrder()
        );
    }

    private JsonNode readParams(String raw) {
        try {
            if (raw == null || raw.isBlank()) {
                return objectMapper.createObjectNode();
            }
            return objectMapper.readTree(raw);
        } catch (Exception ex) {
            log.warn("Invalid params JSON for dye method, fallback to empty object: {}", raw);
            return objectMapper.createObjectNode();
        }
    }

    private List<String> readColors(String raw) {
        try {
            if (raw == null || raw.isBlank()) {
                return List.of("#f7f3e8", "#c9d27c", "#2d6d8e", "#0b3863");
            }
            return objectMapper.readValue(raw, COLOR_LIST);
        } catch (Exception ex) {
            log.warn("Invalid preview colors JSON for dye method, fallback to defaults: {}", raw);
            return List.of("#f7f3e8", "#c9d27c", "#2d6d8e", "#0b3863");
        }
    }
}
