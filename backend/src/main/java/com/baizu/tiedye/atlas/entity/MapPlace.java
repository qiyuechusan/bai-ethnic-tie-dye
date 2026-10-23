package com.baizu.tiedye.atlas.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A 负责的非遗地图：地点。主键使用稳定的英文 id（zhoucheng / xizhou / weishan），
 * 前端通过该 id 关联统计数据与地图坐标。
 */
@Entity
@Table(name = "map_place")
public class MapPlace {

    @Id
    @Column(length = 32)
    private String id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 100)
    private String kicker;

    /**
     * lead 是 MySQL 8 的保留字（窗口函数 LEAD），列名必须加反引号。
     */
    @Column(name = "`lead`", nullable = false, columnDefinition = "TEXT")
    private String lead;

    @Column(nullable = false, length = 255)
    private String highlight;

    @Column(nullable = false, length = 100)
    private String person;

    @Column(name = "current_state", nullable = false, length = 255)
    private String currentState;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, length = 255)
    private String photo;

    @Column(nullable = false, precision = 8, scale = 5)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 8, scale = 5)
    private BigDecimal longitude;

    @Column(name = "map_x", nullable = false, precision = 6, scale = 2)
    private BigDecimal mapX;

    @Column(name = "map_y", nullable = false, precision = 6, scale = 2)
    private BigDecimal mapY;

    @Column(name = "map_scale", nullable = false, precision = 4, scale = 2)
    private BigDecimal mapScale;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKicker() {
        return kicker;
    }

    public void setKicker(String kicker) {
        this.kicker = kicker;
    }

    public String getLead() {
        return lead;
    }

    public void setLead(String lead) {
        this.lead = lead;
    }

    public String getHighlight() {
        return highlight;
    }

    public void setHighlight(String highlight) {
        this.highlight = highlight;
    }

    public String getPerson() {
        return person;
    }

    public void setPerson(String person) {
        this.person = person;
    }

    public String getCurrentState() {
        return currentState;
    }

    public void setCurrentState(String currentState) {
        this.currentState = currentState;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getMapX() {
        return mapX;
    }

    public void setMapX(BigDecimal mapX) {
        this.mapX = mapX;
    }

    public BigDecimal getMapY() {
        return mapY;
    }

    public void setMapY(BigDecimal mapY) {
        this.mapY = mapY;
    }

    public BigDecimal getMapScale() {
        return mapScale;
    }

    public void setMapScale(BigDecimal mapScale) {
        this.mapScale = mapScale;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
