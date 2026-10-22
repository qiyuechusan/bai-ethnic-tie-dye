package com.baizu.tiedye.pattern.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.pattern.entity.Pattern;

public interface PatternRepository extends JpaRepository<Pattern, Long> {

    List<Pattern> findAllByOrderBySortOrderAsc();

    Optional<Pattern> findByName(String name);
}
