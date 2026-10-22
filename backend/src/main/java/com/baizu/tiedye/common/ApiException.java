package com.baizu.tiedye.common;

import org.springframework.http.HttpStatus;

/**
 * 业务异常，携带业务码和 HTTP 状态码。
 */
public class ApiException extends RuntimeException {

    private final int code;
    private final HttpStatus status;

    public ApiException(int code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public int getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
