package com.example.lanbai_backend.controller;

import com.example.lanbai_backend.entity.Artwork;
import com.example.lanbai_backend.entity.Pattern;
import com.example.lanbai_backend.entity.QuizQuestion;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ================= 模块 3 接口 =================

    // 获取所有纹样
    @GetMapping("/patterns")
    public List<Pattern> getPatterns() {
        String sql = "SELECT id, name, image_url AS imageUrl, meaning, category, description, sort_order AS sortOrder FROM pattern ORDER BY sort_order";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(Pattern.class));
    }

    // 获取所有题目
    @GetMapping("/quiz/questions")
    public List<QuizQuestion> getQuestions() {
        String sql = "SELECT id, question_text AS questionText, option_a AS optionA, option_b AS optionB, " +
                     "option_c AS optionC, option_d AS optionD, correct_answer AS correctAnswer, " +
                     "explanation, pattern_id AS patternId, sort_order AS sortOrder FROM quiz_question ORDER BY sort_order";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(QuizQuestion.class));
    }

    // ================= 模块 4 接口 =================

    // 获取已通过审核的作品
    @GetMapping("/artworks")
    public List<Artwork> getArtworks() {
        String sql = "SELECT id, title, image_url AS imageUrl, description, tie_method AS tieMethod, " +
                     "author_name AS authorName, status, created_at AS createdAt FROM artwork WHERE status = 1 ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(Artwork.class));
    }

    // 上传作品（包含图片文件）
    @PostMapping("/artworks/upload")
    public ResponseEntity<?> uploadArtwork(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("tieMethod") String tieMethod,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "authorName", required = false, defaultValue = "匿名匠人") String authorName) {

        if (file.isEmpty()) return ResponseEntity.badRequest().body("文件不能为空");

        try {
            // 1. 确定保存路径，保存在后端项目根目录下的 uploads 文件夹
            String uploadDir = System.getProperty("user.dir") + "/uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            // 2. 生成新文件名防止重名
            String originalName = file.getOriginalFilename();
            String ext = originalName != null && originalName.contains(".") ? originalName.substring(originalName.lastIndexOf(".")) : ".jpg";
            String newFileName = UUID.randomUUID().toString() + ext;
            
            // 3. 保存文件到本地
            file.transferTo(new File(uploadDir + newFileName));

            // 4. 存入数据库（status 设为 1 方便你直接在前端看到效果，正式环境设为 0 等待审核）
            String sql = "INSERT INTO artwork (title, image_url, tie_method, description, author_name, status) VALUES (?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql, title, "/uploads/" + newFileName, tieMethod, description, authorName, 1);

            return ResponseEntity.ok("上传成功");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("上传失败: " + e.getMessage());
        }
    }
        // 点赞接口（染缸温度+1）
    @PostMapping("/artworks/{id}/like")
    public ResponseEntity<?> likeArtwork(@PathVariable Long id) {
        try {
            String sql = "UPDATE artwork SET likes = likes + 1 WHERE id = ?";
            int rows = jdbcTemplate.update(sql, id);
            if (rows > 0) {
                return ResponseEntity.ok("点赞成功");
            }
            return ResponseEntity.badRequest().body("作品不存在");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("点赞失败");
        }
    }
}