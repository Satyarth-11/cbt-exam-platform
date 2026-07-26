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
public class StudentDashboardSummaryDto {

    private long totalAttempts;
    private double averageScore;
    private double highestPercentile;
    private long unreadNotificationsCount;
    private List<ExamSummaryDto> upcomingExams;
    private List<AttemptHistoryDto> recentAttempts;
    private List<NotificationDto> notifications;
}
