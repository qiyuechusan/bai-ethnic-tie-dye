package com.baizu.tiedye.tutor.dto;

/**
 * 聊天里可内嵌的卡片。非当前类型的字段为 null，会被 Jackson 的 non_null 配置省略。
 */
public record TutorCardDto(
        String type,
        QuizCardDto quiz,
        PatternCardDto pattern,
        ClarifyCardDto clarify,
        GradeCardDto grade
) {

    public static TutorCardDto quiz(QuizCardDto quiz) {
        return new TutorCardDto("quiz", quiz, null, null, null);
    }

    public static TutorCardDto pattern(PatternCardDto pattern) {
        return new TutorCardDto("pattern", null, pattern, null, null);
    }

    public static TutorCardDto clarify(ClarifyCardDto clarify) {
        return new TutorCardDto("clarify", null, null, clarify, null);
    }

    public static TutorCardDto grade(GradeCardDto grade) {
        return new TutorCardDto("grade", null, null, null, grade);
    }
}
