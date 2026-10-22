package com.example.lanbai_backend.entity;
import lombok.Data;

@Data
public class Pattern {
    private Long id;
    private String name;
    private String imageUrl;
    private String meaning;
    private String category;
    private String description;
    private Integer sortOrder;
}
