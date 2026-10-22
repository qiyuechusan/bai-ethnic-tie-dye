package com.baizu.tiedye.diy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.diy.entity.DyeTieMethod;

public interface DyeTieMethodRepository extends JpaRepository<DyeTieMethod, Long> {

    List<DyeTieMethod> findByEnabledTrueOrderBySortOrderAsc();

    Optional<DyeTieMethod> findByCode(String code);
}
