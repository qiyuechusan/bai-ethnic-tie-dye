package com.baizu.tiedye.tutor.service;

import java.util.List;

public record ReActValidationResult(boolean valid, List<String> errors) {

    public static ReActValidationResult ok() {
        return new ReActValidationResult(true, List.of());
    }

    public static ReActValidationResult fail(List<String> errors) {
        return new ReActValidationResult(false, List.copyOf(errors));
    }
}
