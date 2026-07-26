package com.exam.platform.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    RESOURCE_NOT_FOUND("ERR_NOT_FOUND", "Requested resource was not found", HttpStatus.NOT_FOUND),
    VALIDATION_FAILED("ERR_VALIDATION", "Invalid payload parameters", HttpStatus.BAD_REQUEST),
    INTERNAL_SERVER_ERROR("ERR_INTERNAL", "An unexpected server error occurred", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED("ERR_UNAUTHORIZED", "Authentication credential is missing or invalid", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("ERR_FORBIDDEN", "Insufficient permissions to perform this operation", HttpStatus.FORBIDDEN);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String defaultMessage, HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }
}
