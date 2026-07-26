package com.exam.platform.dto.dashboard;

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
public class AttemptHistoryDto {

    private UUID attemptId;
    private UUID examId;
    private String examTitle;
    private String subject;
    private String status;
    private Instant startedAt;
    private Instant submittedAt;
    private Double score;
    private Double percentage;
    private Integer rankPosition;
    private Integer totalCorrect;
    private Integer totalIncorrect;
    private Integer totalUnattempted;
    private Double physicsScore;
    private Double chemistryScore;
    private Double mathsScore;
    private Double percentile;
    private String feedbackSummary;
}
