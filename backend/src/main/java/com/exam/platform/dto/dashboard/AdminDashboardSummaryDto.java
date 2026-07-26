package com.exam.platform.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardSummaryDto {

    private long totalActiveStudents;
    private long totalExams;
    private long liveExamsCount;
    private long totalCompletedAttempts;
    private long violationCountPlaceholder; // Wired in Phase 4
    private List<ExamSummaryDto> recentExams;
    private List<MonthlyAttemptChartDto> monthlyAttemptTrends;
    private List<SubjectScoreChartDto> subjectScoreSpread;
}
