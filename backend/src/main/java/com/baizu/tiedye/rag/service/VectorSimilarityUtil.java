package com.baizu.tiedye.rag.service;

public final class VectorSimilarityUtil {

    private VectorSimilarityUtil() {
    }

    public static double cosine(double[] left, double[] right) {
        if (left == null || right == null || left.length == 0 || right.length == 0) {
            return 0.0;
        }
        int length = Math.min(left.length, right.length);
        double dot = 0.0;
        double leftNorm = 0.0;
        double rightNorm = 0.0;
        for (int i = 0; i < length; i++) {
            dot += left[i] * right[i];
            leftNorm += left[i] * left[i];
            rightNorm += right[i] * right[i];
        }
        if (leftNorm <= 0.0 || rightNorm <= 0.0) {
            return 0.0;
        }
        double similarity = dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
        if (Double.isNaN(similarity)) {
            return 0.0;
        }
        return Math.max(-1.0, Math.min(1.0, similarity));
    }
}
