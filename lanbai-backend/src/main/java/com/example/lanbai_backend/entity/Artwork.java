package com.example.lanbai_backend.entity;
import lombok.Data;
import java.util.Date;

@Data
public class Artwork {
    private Long id;
    private String title;
    private String imageUrl;
    private String description;
    private String tieMethod;
    private String authorName;
    private Integer status;
    private Date createdAt;
}
