package com.baizu.tiedye.quiz.dto;

/**
 * 答题列表里的选项只暴露 key 和 content，
 * 不包含 isCorrect，避免正确答案在客户端泄露。
 */
public record OptionDto(String key, String content) {
}
