package com.baizu.tiedye.tutor.tool;

import com.fasterxml.jackson.databind.JsonNode;

public record ToolResult(boolean ok, String summary, JsonNode data) {

    public static ToolResult ok(String summary, JsonNode data) {
        return new ToolResult(true, summary, data);
    }

    public static ToolResult error(String summary) {
        return new ToolResult(false, summary, null);
    }
}
