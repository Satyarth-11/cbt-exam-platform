package com.exam.platform.scheduler;

import com.exam.platform.entity.Exam;
import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.repository.ExamAttemptRepository;
import com.exam.platform.repository.ExamRepository;
import com.exam.platform.service.ExamEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamLifecycleScheduler {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final ExamEngineService examEngineService;

    /**
     * 1. Auto-Transition Exam Statuses
     * Runs every 30 seconds to check if SCHEDULED exams should become LIVE, or LIVE exams become COMPLETED.
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void autoTransitionExams() {
        Instant now = Instant.now();

        // A. SCHEDULED -> LIVE
        List<Exam> scheduledExams = examRepository.findByStatus("SCHEDULED");
        for (Exam exam : scheduledExams) {
            if (exam.getScheduledStartTime() != null && !now.isBefore(exam.getScheduledStartTime())) {
                exam.setStatus("LIVE");
                examRepository.save(exam);
                log.info("BACKGROUND SCHEDULER: Auto-transitioned exam {} ('{}') from SCHEDULED -> LIVE", exam.getId(), exam.getTitle());
            }
        }

        // B. LIVE -> COMPLETED
        List<Exam> liveExams = examRepository.findByStatus("LIVE");
        for (Exam exam : liveExams) {
            if (exam.getScheduledEndTime() != null && now.isAfter(exam.getScheduledEndTime())) {
                exam.setStatus("COMPLETED");
                examRepository.save(exam);
                log.info("BACKGROUND SCHEDULER: Auto-transitioned exam {} ('{}') from LIVE -> COMPLETED", exam.getId(), exam.getTitle());
            }
        }
    }

    /**
     * 2. Auto-Submit Stale / Abandoned IN_PROGRESS Attempts
     * Runs every 60 seconds to detect orphaned sessions exceeding exam duration + 2 minute grace period.
     */
    @Scheduled(fixedRate = 60000)
    public void cleanupStaleAttempts() {
        Instant now = Instant.now();
        List<ExamAttempt> inProgressAttempts = examAttemptRepository.findByStatus("IN_PROGRESS");

        for (ExamAttempt attempt : inProgressAttempts) {
            try {
                int durationMins = attempt.getExam().getDurationMinutes();
                // 2 minutes grace period allowed
                Instant expirationTime = attempt.getStartedAt().plusSeconds((durationMins * 60L) + 120L);

                if (now.isAfter(expirationTime)) {
                    log.warn("BACKGROUND SCHEDULER: Auto-submitting expired stale attempt {} for user {}", attempt.getId(), attempt.getUser().getId());
                    examEngineService.submitAttemptInternal(
                            attempt,
                            attempt.getUser().getId(),
                            "AUTO_SUBMITTED_BACKGROUND_SCHEDULER",
                            "127.0.0.1",
                            "Background Lifecycle Scheduler"
                    );
                }
            } catch (Exception e) {
                log.error("BACKGROUND SCHEDULER: Failed to auto-submit stale attempt {}: {}", attempt.getId(), e.getMessage());
            }
        }
    }
}
