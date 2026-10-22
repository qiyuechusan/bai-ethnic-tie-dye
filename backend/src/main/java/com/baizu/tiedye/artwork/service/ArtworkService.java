package com.baizu.tiedye.artwork.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.baizu.tiedye.artwork.dto.ArtworkDto;
import com.baizu.tiedye.artwork.entity.Artwork;
import com.baizu.tiedye.artwork.repository.ArtworkRepository;
import com.baizu.tiedye.common.ApiException;

@Service
public class ArtworkService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final int MAX_TITLE_LENGTH = 100;
    private static final int MAX_AUTHOR_LENGTH = 50;
    private static final int MAX_METHOD_LENGTH = 32;

    private final ArtworkRepository artworkRepository;
    private final Path uploadRoot;

    public ArtworkService(ArtworkRepository artworkRepository,
                          @Value("${app.upload.dir:${user.dir}/uploads}") String uploadDir) {
        this.artworkRepository = artworkRepository;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional(readOnly = true)
    public List<ArtworkDto> listApproved() {
        return artworkRepository.findByStatusOrderByCreatedAtDesc(1)
                .stream()
                .map(ArtworkDto::from)
                .toList();
    }

    @Transactional
    public ArtworkDto upload(MultipartFile file, String title, String tieMethod,
                             String description, String authorName) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(40001, "请选择要上传的图片", HttpStatus.BAD_REQUEST);
        }
        String safeTitle = requireText(title, "作品名称不能为空", MAX_TITLE_LENGTH);
        String safeMethod = requireText(tieMethod, "请选择扎结方式", MAX_METHOD_LENGTH);
        String safeAuthor = trimToLength(authorName, MAX_AUTHOR_LENGTH);
        if (safeAuthor == null || safeAuthor.isBlank()) {
            safeAuthor = "匿名匠人";
        }

        String originalName = file.getOriginalFilename();
        String extension = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ApiException(40001, "只支持 jpg、jpeg、png、webp 图片", HttpStatus.BAD_REQUEST);
        }

        try {
            Files.createDirectories(uploadRoot);
            String fileName = UUID.randomUUID() + extension;
            Path target = uploadRoot.resolve(fileName).normalize();
            if (!target.startsWith(uploadRoot)) {
                throw new ApiException(40001, "文件名不合法", HttpStatus.BAD_REQUEST);
            }
            file.transferTo(target);

            Artwork artwork = new Artwork();
            artwork.setTitle(safeTitle);
            artwork.setImageUrl("/uploads/" + fileName);
            artwork.setDescription(trimToLength(description, 1000));
            artwork.setTieMethod(safeMethod);
            artwork.setAuthorName(safeAuthor);
            artwork.setStatus(1);
            artwork.setLikes(0);
            return ArtworkDto.from(artworkRepository.save(artwork));
        } catch (IOException ex) {
            throw new ApiException(50000, "图片保存失败，请稍后重试", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public Map<String, Object> like(Long id) {
        Artwork artwork = artworkRepository.findById(id)
                .orElseThrow(() -> new ApiException(40401, "作品不存在", HttpStatus.NOT_FOUND));
        int likes = artwork.getLikes() == null ? 0 : artwork.getLikes();
        artwork.setLikes(likes + 1);
        artworkRepository.save(artwork);
        return Map.of("id", artwork.getId(), "likes", artwork.getLikes());
    }

    private String requireText(String value, String message, int maxLength) {
        String trimmed = trimToLength(value, maxLength);
        if (trimmed == null || trimmed.isBlank()) {
            throw new ApiException(40001, message, HttpStatus.BAD_REQUEST);
        }
        return trimmed;
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    private String extensionOf(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot).toLowerCase(Locale.ROOT);
    }
}
