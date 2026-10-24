package com.baizu.tiedye.ai.client.local;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

import com.baizu.tiedye.ai.client.EmbeddingClient;
import com.baizu.tiedye.ai.client.EmbeddingPurpose;

/**
 * 无网络、无 Key 时的确定性向量兜底。
 *
 * <p>把文本拆成字符 1/2/3-gram，用 FNV-1a 做特征哈希到固定维度，
 * 再用第二哈希位决定符号，最后 L2 归一化。它不是语义模型，但对中文短文本
 * 的字面相近度足够稳定，配合关键词检索可以完成离线演示。</p>
 */
public class LocalHashEmbeddingClient implements EmbeddingClient {

    public static final String MODEL_ID = "local-hash-v1";
    private static final long FNV_OFFSET = 0xcbf29ce484222325L;
    private static final long FNV_PRIME = 0x100000001b3L;

    private final int dimensions;

    public LocalHashEmbeddingClient(int dimensions) {
        this.dimensions = Math.max(64, dimensions);
    }

    @Override
    public String modelId() {
        return MODEL_ID;
    }

    @Override
    public int dimensions() {
        return dimensions;
    }

    @Override
    public boolean isRemote() {
        return false;
    }

    @Override
    public List<double[]> embed(List<String> texts, EmbeddingPurpose purpose) {
        List<double[]> result = new ArrayList<>(texts.size());
        for (String text : texts) {
            result.add(embedText(text));
        }
        return result;
    }

    private double[] embedText(String text) {
        double[] vector = new double[dimensions];
        String normalized = normalize(text);
        if (normalized.isEmpty()) {
            return vector;
        }

        List<String> units = new ArrayList<>();
        int length = normalized.length();
        for (int i = 0; i < length; i++) {
            double weight = containsCjk(normalized.charAt(i)) ? 0.3 : 0.2;
            units.add(weight + "|" + normalized.substring(i, i + 1));
            if (i + 1 < length) {
                units.add("1.0|" + normalized.substring(i, i + 2));
            }
            if (i + 2 < length) {
                units.add("0.6|" + normalized.substring(i, i + 3));
            }
        }

        // 英文/数字按整词再加一次，避免被字符 n-gram 稀释。
        for (String token : normalized.split("[^0-9a-z]+")) {
            if (token.length() >= 2) {
                units.add("0.8|w:" + token);
            }
        }

        for (String unit : units) {
            int separator = unit.indexOf('|');
            double weight = Double.parseDouble(unit.substring(0, separator));
            String gram = unit.substring(separator + 1);
            long hash = fnv1a(gram);
            int index = (int) Math.floorMod(hash, dimensions);
            double sign = ((hash >>> 63) & 1L) == 0L ? 1.0 : -1.0;
            vector[index] += weight * sign;
        }

        double norm = 0.0;
        for (double value : vector) {
            norm += value * value;
        }
        if (norm > 0) {
            double scale = 1.0 / Math.sqrt(norm);
            for (int i = 0; i < vector.length; i++) {
                vector[i] *= scale;
            }
        }
        return vector;
    }

    private static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String nfkc = Normalizer.normalize(text, Normalizer.Form.NFKC).toLowerCase();
        StringBuilder builder = new StringBuilder(nfkc.length());
        for (int i = 0; i < nfkc.length(); i++) {
            char ch = nfkc.charAt(i);
            if (Character.isLetterOrDigit(ch) || Character.isWhitespace(ch)) {
                builder.append(Character.isWhitespace(ch) ? ' ' : ch);
            }
        }
        return builder.toString().trim();
    }

    private static boolean containsCjk(char ch) {
        return Character.UnicodeScript.of(ch) == Character.UnicodeScript.HAN;
    }

    private static long fnv1a(String value) {
        long hash = FNV_OFFSET;
        for (int i = 0; i < value.length(); i++) {
            hash ^= value.charAt(i);
            hash *= FNV_PRIME;
        }
        return hash;
    }
}
