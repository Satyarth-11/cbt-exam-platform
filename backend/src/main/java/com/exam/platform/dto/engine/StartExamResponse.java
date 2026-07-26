package com.exam.platform.dto.engine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartExamResponse {
    private UUID attemptId;
    private UUID examId;
    private String examTitle;
    private Instant startedAt;
    private long totalDurationSeconds;
}
