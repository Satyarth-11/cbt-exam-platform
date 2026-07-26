package com.exam.platform.service;

import com.exam.platform.dto.proctor.AttemptProctorStatusDto;
import com.exam.platform.dto.proctor.ProctorViolationRequest;
import com.exam.platform.dto.proctor.ViolationLogResponse;
import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.entity.ProctorViolation;
import com.exam.platform.entity.User;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.ExamAttemptRepository;
import com.exam.platform.repository.ProctorViolationRepository;
import com.exam.platform.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ProctoringService {

    private final ExamAttemptRepository attemptRepository;
    private final ProctorViolationRepository violationRepository;
    private final UserRepository userRepository;
    private final com.exam.platform.repository.UserSessionRepository userSessionRepository;
    private final AuditLogService auditLogService;
    private final ExamEngineService examEngineService;

    public ProctoringService(
            ExamAttemptRepository attemptRepository,
            ProctorViolationRepository violationRepository,
            UserRepository userRepository,
            com.exam.platform.repository.UserSessionRepository userSessionRepository,
            AuditLogService auditLogService,
            @Lazy ExamEngineService examEngineService
    ) {
        this.attemptRepository = attemptRepository;
        this.violationRepository = violationRepository;
        this.userRepository = userRepository;
        this.userSessionRepository = userSessionRepository;
        this.auditLogService = auditLogService;
        this.examEngineService = examEngineService;
    }

    @Transactional
    public void pauseAttempt(UUID attemptId, UUID adminUserId, String reason, String ipAddress, String userAgent) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));
        attempt.setStatus("PAUSED");
        attempt.setPausedAt(Instant.now());
        attemptRepository.save(attempt);

        com.exam.platform.websocket.SignalingHandler.sendControlCommandToCandidate(attemptId.toString(), "EXAM_PAUSED", reason);
        auditLogService.log(adminUserId, "PROCTOR_PAUSE_EXAM", "Paused exam attempt " + attemptId + ". Reason: " + reason, ipAddress, userAgent);
    }

    @Transactional
    public void resumeAttempt(UUID attemptId, UUID adminUserId, String ipAddress, String userAgent) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        if (attempt.getPausedAt() != null) {
            long addedSeconds = Duration.between(attempt.getPausedAt(), Instant.now()).toSeconds();
            long currentPaused = attempt.getPausedDurationSeconds() != null ? attempt.getPausedDurationSeconds() : 0L;
            attempt.setPausedDurationSeconds(currentPaused + addedSeconds);
            attempt.setPausedAt(null);
        }

        attempt.setStatus("IN_PROGRESS");
        attemptRepository.save(attempt);

        com.exam.platform.websocket.SignalingHandler.sendControlCommandToCandidate(attemptId.toString(), "EXAM_RESUMED", "Exam resumed by proctor.");
        auditLogService.log(adminUserId, "PROCTOR_RESUME_EXAM", "Resumed exam attempt " + attemptId, ipAddress, userAgent);
    }

    @Transactional
    public void forceSubmitAttempt(UUID attemptId, UUID adminUserId, String reason, String ipAddress, String userAgent) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        examEngineService.submitAttemptInternal(attempt, attempt.getUser().getId(), "FORCE_SUBMITTED_BY_PROCTOR", ipAddress, userAgent);
        com.exam.platform.websocket.SignalingHandler.sendControlCommandToCandidate(attemptId.toString(), "FORCE_SUBMITTED", reason);
        auditLogService.log(adminUserId, "PROCTOR_FORCE_SUBMIT", "Force-submitted exam attempt " + attemptId + ". Reason: " + reason, ipAddress, userAgent);
    }

    @Transactional
    public void blockStudent(UUID attemptId, UUID adminUserId, String reason, String ipAddress, String userAgent) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        User student = attempt.getUser();
        student.setActive(false);
        userRepository.save(student);

        // Instantly invalidate all active DB sessions for this user so their next HTTP request returns 401 Session Invalidated
        userSessionRepository.invalidateAllActiveSessionsForUser(student);

        examEngineService.submitAttemptInternal(attempt, student.getId(), "STUDENT_BLOCKED_BY_PROCTOR", ipAddress, userAgent);
        com.exam.platform.websocket.SignalingHandler.sendControlCommandToCandidate(attemptId.toString(), "STUDENT_BLOCKED", "Candidate account locked due to severe proctoring violations: " + reason);
        auditLogService.log(adminUserId, "PROCTOR_BLOCK_STUDENT", "Blocked student " + student.getUsername() + " (Attempt ID: " + attemptId + "). Reason: " + reason, ipAddress, userAgent);
    }

    @Transactional
    public void sendWarning(UUID attemptId, UUID adminUserId, String warningMessage, String ipAddress, String userAgent) {
        com.exam.platform.websocket.SignalingHandler.sendControlCommandToCandidate(attemptId.toString(), "WARNING_MESSAGE", warningMessage);
        auditLogService.log(adminUserId, "PROCTOR_SEND_WARNING", "Sent warning to attempt " + attemptId + ": " + warningMessage, ipAddress, userAgent);
    }

    @Transactional
    public ViolationLogResponse logViolation(UUID attemptId, ProctorViolationRequest request, UUID userId, String ipAddress, String userAgent) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        if (!attempt.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized attempt proctor log modification");
        }

        String severity = determineSeverity(request.getViolationType());

        ProctorViolation violation = ProctorViolation.builder()
                .attempt(attempt)
                .violationType(request.getViolationType())
                .severity(severity)
                .details(request.getDetails())
                .build();
        violationRepository.save(violation);

        auditLogService.log(userId, "PROCTOR_VIOLATION", 
                "Violation detected [" + severity + "]: " + request.getViolationType() + " | Details: " + request.getDetails(), 
                ipAddress, userAgent);

        log.info("Logged violation {} [{}] for attempt {} by candidate {}", request.getViolationType(), severity, attemptId, userId);

        long totalViolations = violationRepository.countByAttempt(attempt);
        int maxAllowed = attempt.getExam().getMaxViolations() != null ? attempt.getExam().getMaxViolations() : 3;

        boolean autosubmitted = false;
        String message = "Violation logged successfully.";

        if (totalViolations >= maxAllowed && "IN_PROGRESS".equals(attempt.getStatus())) {
            log.warn("Attempt {} reached maximum violation threshold ({}/{}). Auto-submitting exam.", attemptId, totalViolations, maxAllowed);
            examEngineService.submitAttemptInternal(attempt, userId, "AUTO_SUBMITTED_VIOLATIONS", ipAddress, userAgent);
            autosubmitted = true;
            message = "Exam auto-submitted due to exceeding maximum allowed proctoring violation threshold.";
        }

        return ViolationLogResponse.builder()
                .autosubmitted(autosubmitted)
                .message(message)
                .totalViolations(totalViolations)
                .threshold(maxAllowed)
                .build();
    }

    private String determineSeverity(String violationType) {
        if (violationType == null) return "MEDIUM";
        switch (violationType.toUpperCase()) {
            case "FULLSCREEN_EXIT":
            case "TAB_SWITCH":
            case "DEVTOOLS_OPEN":
            case "MULTIPLE_FACES":
                return "HIGH";
            case "PRINT_ATTEMPT":
            case "FACE_MISSING":
                return "MEDIUM";
            case "COPY_PASTE":
            default:
                return "LOW";
        }
    }

    @Transactional(readOnly = true)
    public List<AttemptProctorStatusDto.ViolationDetailDto> getAttemptViolations(UUID attemptId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        return violationRepository.findByAttemptOrderByCreatedAtDesc(attempt).stream()
                .map(v -> AttemptProctorStatusDto.ViolationDetailDto.builder()
                        .id(v.getId())
                        .violationType(v.getViolationType())
                        .severity(v.getSeverity())
                        .details(v.getDetails())
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttemptProctorStatusDto> getActiveProctorSessions() {
        List<ExamAttempt> activeAttempts = attemptRepository.findAll().stream()
                .filter(a -> "IN_PROGRESS".equals(a.getStatus()))
                .collect(Collectors.toList());

        return activeAttempts.stream().map(a -> {
            User u = a.getUser();
            long elapsedSeconds = Duration.between(a.getStartedAt(), Instant.now()).toSeconds();
            long totalSeconds = a.getExam().getDurationMinutes() * 60L;
            long remaining = Math.max(0, totalSeconds - elapsedSeconds);

            long violationsCount = violationRepository.countByAttempt(a);

            List<AttemptProctorStatusDto.ViolationDetailDto> violationDetails = violationRepository.findByAttemptOrderByCreatedAtDesc(a).stream()
                    .map(v -> AttemptProctorStatusDto.ViolationDetailDto.builder()
                            .id(v.getId())
                            .violationType(v.getViolationType())
                            .severity(v.getSeverity())
                            .details(v.getDetails())
                            .createdAt(v.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());

            return AttemptProctorStatusDto.builder()
                    .attemptId(a.getId())
                    .userId(u.getId())
                    .username(u.getUsername())
                    .email(u.getEmail())
                    .firstName(u.getFirstName())
                    .lastName(u.getLastName())
                    .examTitle(a.getExam().getTitle())
                    .startedAt(a.getStartedAt())
                    .status(a.getStatus())
                    .remainingSeconds(remaining)
                    .totalViolationsCount(violationsCount)
                    .violations(violationDetails)
                    .build();
        }).collect(Collectors.toList());
    }
}
