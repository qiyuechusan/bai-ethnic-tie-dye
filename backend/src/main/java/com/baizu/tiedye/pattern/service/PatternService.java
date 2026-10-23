package com.baizu.tiedye.pattern.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baizu.tiedye.pattern.dto.PatternDto;
import com.baizu.tiedye.pattern.repository.PatternRepository;

@Service
@Transactional(readOnly = true)
public class PatternService {

    private final PatternRepository patternRepository;

    public PatternService(PatternRepository patternRepository) {
        this.patternRepository = patternRepository;
    }

    public List<PatternDto> listAll() {
        return patternRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(PatternDto::from)
                .toList();
    }
}
