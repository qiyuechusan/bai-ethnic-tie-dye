package com.baizu.tiedye.atlas.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.atlas.entity.MapPlace;

public interface MapPlaceRepository extends JpaRepository<MapPlace, String> {

    List<MapPlace> findAllByOrderBySortOrderAsc();
}
