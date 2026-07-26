package com.exam.platform.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetailedScorecardDto {
    private UUID attemptId;
    private UUID examId;
    private String examTitle;
    private String candidateName;
    private String candidateEmail;
    private double score;
    private double totalMarks;
    private double percentage;
    private double percentile;
    private int rankPosition;
    private long totalCandidates;
    private String status; // SUBMITTED, AUTO_SUBMITTED, AUTO_SUBMITTED_VIOLATIONS
    private Instant startedAt;
    private Instant submittedAt;
    private long durationSeconds;
    private String feedbackSummary;
    private List<SubjectPerformanceDto> subjectBreakdown;
    private List<QuestionReviewDto> questionReviews;
}
