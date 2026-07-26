package com.exam.platform.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamAnalyticsReportDto {
    private UUID examId;
    private String examTitle;
    private String subject;
    private long totalCandidatesAttempted;
    private double averageScore;
    private double highestScore;
    private double lowestScore;
    private double medianScore;
    private double passPercentage;
    private Map<String, Integer> scoreDistribution; // "0-25%", "26-50%", "51-75%", "76-100%" -> count
    private List<SubjectPerformanceDto> subjectAverages;
    private List<CandidateRankDto> candidateRankings;
}
