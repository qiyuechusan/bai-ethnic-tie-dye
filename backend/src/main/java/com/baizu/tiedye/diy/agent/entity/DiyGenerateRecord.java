package com.baizu.tiedye.diy.agent.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * 模块 5 的生成任务快照，用于记录、回溯与同会话微调。
 */
@Entity
@Table(name = "diy_generate_record",
        indexes = {
                @Index(name = "idx_diy_gen_session", columnList = "session_id, created_at"),
                @Index(name = "idx_diy_gen_user", columnList = "user_id, created_at")
        })
public class DiyGenerateRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Column(length = 16)
    private String fabric;

    @Column(precision = 4, scale = 2)
    private BigDecimal concentration;

    @Column(name = "canvas_width")
    private Integer canvasWidth;

    @Column(name = "canvas_height")
    private Integer canvasHeight;

    @Column(name = "renderer_type", length = 16)
    private String rendererType;

    @Column(name = "motif_type", length = 32)
    private String motifType;

    @Column(name = "method_code", length = 48)
    private String methodCode;

    @Column(length = 16)
    private String seed;

    @Column(name = "pattern_params_json", columnDefinition = "LONGTEXT")
    private String patternParamsJson;

    @Column(name = "oxidation_params_json", columnDefinition = "LONGTEXT")
    private String oxidationParamsJson;

    @Column(name = "preview_colors_json", columnDefinition = "LONGTEXT")
    private String previewColorsJson;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "citations_json", columnDefinition = "LONGTEXT")
    private String citationsJson;

    @Column(nullable = false)
    private Boolean degraded = Boolean.FALSE;

    @Column(length = 16)
    private String mode;

    @Column(length = 64)
    private String model;

    @Column(name = "validation_attempts")
    private Integer validationAttempts = 0;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getFabric() {
        return fabric;
    }

    public void setFabric(String fabric) {
        this.fabric = fabric;
    }

    public BigDecimal getConcentration() {
        return concentration;
    }

    public void setConcentration(BigDecimal concentration) {
        this.concentration = concentration;
    }

    public Integer getCanvasWidth() {
        return canvasWidth;
    }

    public void setCanvasWidth(Integer canvasWidth) {
        this.canvasWidth = canvasWidth;
    }

    public Integer getCanvasHeight() {
        return canvasHeight;
    }

    public void setCanvasHeight(Integer canvasHeight) {
        this.canvasHeight = canvasHeight;
    }

    public String getRendererType() {
        return rendererType;
    }

    public void setRendererType(String rendererType) {
        this.rendererType = rendererType;
    }

    public String getMotifType() {
        return motifType;
    }

    public void setMotifType(String motifType) {
        this.motifType = motifType;
    }

    public String getMethodCode() {
        return methodCode;
    }

    public void setMethodCode(String methodCode) {
        this.methodCode = methodCode;
    }

    public String getSeed() {
        return seed;
    }

    public void setSeed(String seed) {
        this.seed = seed;
    }

    public String getPatternParamsJson() {
        return patternParamsJson;
    }

    public void setPatternParamsJson(String patternParamsJson) {
        this.patternParamsJson = patternParamsJson;
    }

    public String getOxidationParamsJson() {
        return oxidationParamsJson;
    }

    public void setOxidationParamsJson(String oxidationParamsJson) {
        this.oxidationParamsJson = oxidationParamsJson;
    }

    public String getPreviewColorsJson() {
        return previewColorsJson;
    }

    public void setPreviewColorsJson(String previewColorsJson) {
        this.previewColorsJson = previewColorsJson;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getCitationsJson() {
        return citationsJson;
    }

    public void setCitationsJson(String citationsJson) {
        this.citationsJson = citationsJson;
    }

    public Boolean getDegraded() {
        return degraded;
    }

    public void setDegraded(Boolean degraded) {
        this.degraded = degraded;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getValidationAttempts() {
        return validationAttempts;
    }

    public void setValidationAttempts(Integer validationAttempts) {
        this.validationAttempts = validationAttempts;
    }

    public Integer getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(Integer latencyMs) {
        this.latencyMs = latencyMs;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
