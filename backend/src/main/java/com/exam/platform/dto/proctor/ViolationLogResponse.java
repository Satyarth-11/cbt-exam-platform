package com.exam.platform.dto.proctor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationLogResponse {
    private boolean autosubmitted;
    private String message;
    private long totalViolations;
    private int threshold;
}
