package com.exam.platform.dto.analytics;

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
public class CandidateRankDto {
    private int rank;
    private UUID attemptId;
    private UUID userId;
    private String candidateName;
    private String email;
    private double score;
    private double percentage;
    private double percentile;
    private String status;
    private long violationCount;
    private Instant submittedAt;
}
