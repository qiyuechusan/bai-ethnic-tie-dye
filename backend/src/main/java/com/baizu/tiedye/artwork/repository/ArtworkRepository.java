package com.baizu.tiedye.artwork.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.artwork.entity.Artwork;

public interface ArtworkRepository extends JpaRepository<Artwork, Long> {

    List<Artwork> findByStatusOrderByCreatedAtDesc(Integer status);
}
