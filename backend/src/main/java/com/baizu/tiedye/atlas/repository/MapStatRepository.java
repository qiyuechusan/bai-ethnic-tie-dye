package com.baizu.tiedye.atlas.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.atlas.entity.MapStat;

public interface MapStatRepository extends JpaRepository<MapStat, String> {
}
