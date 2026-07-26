package com.exam.platform.service;

import com.exam.platform.dto.dashboard.*;
import com.exam.platform.entity.*;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentDashboardService {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final ExamResultRepository resultRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public StudentDashboardSummaryDto getStudentDashboardSummary(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        long totalAttempts = attemptRepository.countByUser(user);
        Double avgScore = attemptRepository.findAverageScoreByUser(user);
        
        List<ExamAttempt> attempts = attemptRepository.findByUserOrderByStartedAtDesc(user);
        double highestPercentile = attempts.stream()
                .map(attempt -> resultRepository.findByAttempt(attempt).map(ExamResult::getPercentile).orElse(0.0))
                .mapToDouble(Double::doubleValue)
                .max()
                .orElse(0.0);

        long unreadNotifications = notificationRepository.countUnreadNotificationsForUser(user);

        List<ExamSummaryDto> upcomingExams = examRepository.findTop10ByStatusInOrderByScheduledStartTimeAsc(List.of("SCHEDULED", "LIVE"))
                .stream()
                .map(this::mapToExamSummaryDto)
                .collect(Collectors.toList());

        List<AttemptHistoryDto> recentAttempts = attempts.stream()
                .map(this::mapToAttemptHistoryDto)
                .collect(Collectors.toList());

        List<NotificationDto> notifications = notificationRepository.findByUserOrUserIsNullOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToNotificationDto)
                .collect(Collectors.toList());

        return StudentDashboardSummaryDto.builder()
                .totalAttempts(totalAttempts)
                .averageScore(avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0)
                .highestPercentile(Math.round(highestPercentile * 100.0) / 100.0)
                .unreadNotificationsCount(unreadNotifications)
                .upcomingExams(upcomingExams)
                .recentAttempts(recentAttempts)
                .notifications(notifications)
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

    private AttemptHistoryDto mapToAttemptHistoryDto(ExamAttempt attempt) {
        ExamResult result = resultRepository.findByAttempt(attempt).orElse(null);

        return AttemptHistoryDto.builder()
                .attemptId(attempt.getId())
                .examId(attempt.getExam().getId())
                .examTitle(attempt.getExam().getTitle())
                .subject(attempt.getExam().getSubject())
                .status(attempt.getStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .score(attempt.getScore())
                .percentage(attempt.getPercentage())
                .rankPosition(attempt.getRankPosition())
                .totalCorrect(result != null ? result.getTotalCorrect() : 0)
                .totalIncorrect(result != null ? result.getTotalIncorrect() : 0)
                .totalUnattempted(result != null ? result.getTotalUnattempted() : 0)
                .physicsScore(result != null ? result.getPhysicsScore() : 0.0)
                .chemistryScore(result != null ? result.getChemistryScore() : 0.0)
                .mathsScore(result != null ? result.getMathsScore() : 0.0)
                .percentile(result != null ? result.getPercentile() : 0.0)
                .feedbackSummary(result != null ? result.getFeedbackSummary() : "")
                .build();
    }

    private NotificationDto mapToNotificationDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
