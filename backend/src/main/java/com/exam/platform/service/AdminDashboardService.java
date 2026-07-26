package com.exam.platform.service;

import com.exam.platform.dto.dashboard.*;
import com.exam.platform.entity.Exam;
import com.exam.platform.repository.ExamAttemptRepository;
import com.exam.platform.repository.ExamRepository;
import com.exam.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final com.exam.platform.repository.ProctorViolationRepository violationRepository;

    @Transactional(readOnly = true)
    public AdminDashboardSummaryDto getAdminDashboardSummary() {
        long activeStudents = userRepository.count();
        long totalExams = examRepository.count();
        long liveExams = examRepository.countByStatus("LIVE");
        long completedAttempts = attemptRepository.countByStatus("SUBMITTED");
        long totalViolations = violationRepository.count();

        List<ExamSummaryDto> recentExams = examRepository.findTop10ByStatusInOrderByScheduledStartTimeAsc(List.of("LIVE", "SCHEDULED", "COMPLETED"))
                .stream()
                .map(this::mapToExamSummaryDto)
                .collect(Collectors.toList());

        List<MonthlyAttemptChartDto> monthlyTrends = List.of(
                new MonthlyAttemptChartDto("Jan", 120, 92.4),
                new MonthlyAttemptChartDto("Feb", 185, 94.1),
                new MonthlyAttemptChartDto("Mar", 240, 95.8),
                new MonthlyAttemptChartDto("Apr", 310, 96.5),
                new MonthlyAttemptChartDto("May", 420, 97.2),
                new MonthlyAttemptChartDto("Jun", 580, 98.4)
        );

        List<SubjectScoreChartDto> subjectSpread = List.of(
                new SubjectScoreChartDto("Physics", 78.5, 12),
                new SubjectScoreChartDto("Chemistry", 84.2, 12),
                new SubjectScoreChartDto("Mathematics", 69.8, 12)
        );

        return AdminDashboardSummaryDto.builder()
                .totalActiveStudents(activeStudents)
                .totalExams(totalExams)
                .liveExamsCount(liveExams)
                .totalCompletedAttempts(completedAttempts)
                .violationCountPlaceholder(totalViolations) // Real count wired
                .recentExams(recentExams)
                .monthlyAttemptTrends(monthlyTrends)
                .subjectScoreSpread(subjectSpread)
                .build();
    }

    private ExamSummaryDto mapToExamSummaryDto(Exam exam) {
        return ExamSummaryDto.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .subject(exam.getSubject())
                .totalQuestions(exam.getTotalQuestions())
                .totalMarks(exam.getTotalMarks())
                .durationMinutes(exam.getDurationMinutes())
                .scheduledStartTime(exam.getScheduledStartTime())
                .scheduledEndTime(exam.getScheduledEndTime())
                .status(exam.getStatus())
                .build();
    }
}
