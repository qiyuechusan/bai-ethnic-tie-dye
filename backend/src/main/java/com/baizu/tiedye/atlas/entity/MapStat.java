package com.baizu.tiedye.atlas.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A 负责的非遗地图：地点统计。与 map_place 一对一，place_id 既是主键也是外键。
 */
@Entity
@Table(name = "map_stat")
public class MapStat {

    @Id
    @Column(name = "place_id", length = 32)
    private String placeId;

    @Column(nullable = false)
    private Integer workers;

    @Column(nullable = false)
    private Integer workshops;

    @Column(name = "annual_output", length = 32)
    private String annualOutput;

    @Column(name = "source_note", nullable = false, length = 255)
    private String sourceNote;

    @Column(name = "updated_at", nullable = false)
    private LocalDate updatedAt;

    public String getPlaceId() {
        return placeId;
    }

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }

    public Integer getWorkers() {
        return workers;
    }

    public void setWorkers(Integer workers) {
        this.workers = workers;
    }

    public Integer getWorkshops() {
        return workshops;
    }

    public void setWorkshops(Integer workshops) {
        this.workshops = workshops;
    }

    public String getAnnualOutput() {
        return annualOutput;
    }

    public void setAnnualOutput(String annualOutput) {
        this.annualOutput = annualOutput;
    }

    public String getSourceNote() {
        return sourceNote;
    }

    public void setSourceNote(String sourceNote) {
        this.sourceNote = sourceNote;
    }

    public LocalDate getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDate updatedAt) {
        this.updatedAt = updatedAt;
    }
}
