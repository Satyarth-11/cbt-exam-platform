package com.exam.platform.service;

import com.exam.platform.dto.dashboard.AttemptHistoryDto;
import com.exam.platform.dto.engine.*;
import com.exam.platform.entity.*;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamEngineService {

    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final ExamAttemptRepository attemptRepository;
    private final ExamResultRepository resultRepository;
    private final QuestionRepository questionRepository;
    private final CandidateAnswerRepository candidateAnswerRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public StartExamResponse startAttempt(UUID examId, UUID userId, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", examId));

        // Check if there is already an IN_PROGRESS attempt for this exam by this user
        List<ExamAttempt> existingAttempts = attemptRepository.findByUserOrderByStartedAtDesc(user);
        Optional<ExamAttempt> activeAttempt = existingAttempts.stream()
                .filter(a -> a.getExam().getId().equals(examId) && "IN_PROGRESS".equals(a.getStatus()))
                .findFirst();

        if (activeAttempt.isPresent()) {
            ExamAttempt attempt = activeAttempt.get();
            log.info("Resuming existing attempt {} for user {}", attempt.getId(), userId);
            return StartExamResponse.builder()
                    .attemptId(attempt.getId())
                    .examId(exam.getId())
                    .examTitle(exam.getTitle())
                    .startedAt(attempt.getStartedAt())
                    .totalDurationSeconds(exam.getDurationMinutes() * 60)
                    .build();
        }

        // Create deterministic per-attempt shuffle seed using random Long generator
        long shuffleSeed = new java.util.Random().nextLong();

        // Create new attempt
        ExamAttempt attempt = ExamAttempt.builder()
                .exam(exam)
                .user(user)
                .status("IN_PROGRESS")
                .startedAt(Instant.now())
                .shuffleSeed(shuffleSeed)
                .build();
        ExamAttempt savedAttempt = attemptRepository.save(attempt);

        // Pre-create candidate answers for all questions
        List<Question> questions = questionRepository.findByExamOrderBySequenceNumberAsc(exam);
        List<CandidateAnswer> answers = questions.stream()
                .map(q -> CandidateAnswer.builder()
                        .attempt(savedAttempt)
                        .question(q)
                        .status("NOT_VISITED")
                        .build())
                .collect(Collectors.toList());
        candidateAnswerRepository.saveAll(answers);

        auditLogService.log(userId, "EXAM_STARTED", "Started exam attempt: " + savedAttempt.getId() + " with shuffle seed: " + shuffleSeed, ipAddress, userAgent);

        return StartExamResponse.builder()
                .attemptId(savedAttempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .startedAt(savedAttempt.getStartedAt())
                .totalDurationSeconds(exam.getDurationMinutes() * 60)
                .build();
    }

    @Transactional
    public ExamSessionDto getExamSession(UUID attemptId, UUID userId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        if (!attempt.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to exam session");
        }

        Exam exam = attempt.getExam();
        long rawElapsedSeconds = Duration.between(attempt.getStartedAt(), Instant.now()).toSeconds();
        long pausedSeconds = attempt.getPausedDurationSeconds() != null ? attempt.getPausedDurationSeconds() : 0L;
        if ("PAUSED".equals(attempt.getStatus()) && attempt.getPausedAt() != null) {
            pausedSeconds += Duration.between(attempt.getPausedAt(), Instant.now()).toSeconds();
        }
        long netElapsedSeconds = Math.max(0, rawElapsedSeconds - pausedSeconds);
        long totalDurationSeconds = exam.getDurationMinutes() * 60L;
        long remainingSeconds = Math.max(0, totalDurationSeconds - netElapsedSeconds);

        if ("IN_PROGRESS".equals(attempt.getStatus()) && (totalDurationSeconds - netElapsedSeconds) <= -30) {
            // Auto-submit if exceeded grace period
            log.info("Auto-submitting expired exam attempt {}", attemptId);
            submitAttemptInternal(attempt, userId, "AUTO_SUBMITTED", "127.0.0.1", "System Auto-Submit");
            remainingSeconds = 0;
        }

        // Deterministic Shuffling seed + load all questions ordered by sequence
        long seed = attempt.getShuffleSeed() != null ? attempt.getShuffleSeed() : 0L;
        List<Question> rawQuestions = questionRepository.findByExamOrderBySequenceNumberAsc(exam);

        // Group questions by subject dynamically (supports any exam type: SSC, NEET, JEE, BANKING, UPSC, etc.)
        java.util.Map<String, List<Question>> subjectGrouped = new java.util.LinkedHashMap<>();
        for (Question q : rawQuestions) {
            String subj = q.getSubject() != null ? q.getSubject() : "GENERAL";
            subjectGrouped.computeIfAbsent(subj, k -> new java.util.ArrayList<>()).add(q);
        }

        List<Question> shuffledQuestions = new java.util.ArrayList<>();
        for (java.util.Map.Entry<String, List<Question>> entry : subjectGrouped.entrySet()) {
            List<Question> subjectList = entry.getValue();
            java.util.Collections.shuffle(subjectList, new java.util.Random(seed + entry.getKey().hashCode()));
            shuffledQuestions.addAll(subjectList);
        }

        List<QuestionSessionDto> questionDtos = shuffledQuestions.stream().map(q -> {
            QuestionSessionDto dto = QuestionSessionDto.builder()
                    .id(q.getId())
                    .subject(q.getSubject())
                    .section(q.getSection())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType())
                    .markingPositive(q.getMarkingPositive())
                    .markingNegative(q.getMarkingNegative())
                    .sequenceNumber(q.getSequenceNumber())
                    .parentQuestionId(q.getParentQuestion() != null ? q.getParentQuestion().getId() : null)
                    .passageText(q.getPassageText())
                    .build();

            // Shuffle options for MCQ / MULTIPLE_CHOICE questions
            if ("MCQ".equals(q.getQuestionType()) || "MULTIPLE_CHOICE".equals(q.getQuestionType())) {
                List<String> options = new java.util.ArrayList<>(List.of(q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD()));
                long qSeed = seed + q.getId().hashCode();
                java.util.Collections.shuffle(options, new java.util.Random(qSeed));

                dto.setOptionA(options.get(0));
                dto.setOptionB(options.get(1));
                dto.setOptionC(options.get(2));
                dto.setOptionD(options.get(3));
            }
            return dto;
        }).collect(Collectors.toList());

        List<AnswerSessionDto> answerDtos = candidateAnswerRepository.findByAttempt(attempt)
                .stream()
                .map(a -> AnswerSessionDto.builder()
                        .questionId(a.getQuestion().getId())
                        .selectedOption(a.getSelectedOption())
                        .numericalAnswer(a.getNumericalAnswer())
                        .status(a.getStatus())
                        .build())
                .collect(Collectors.toList());

        return ExamSessionDto.builder()
                .attemptId(attempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .remainingSeconds(remainingSeconds)
                .questions(questionDtos)
                .answers(answerDtos)
                .build();
    }

    @Transactional
    public SaveAnswerResponse saveAnswer(UUID attemptId, SaveAnswerRequest request, UUID userId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        if (!attempt.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized attempt modification");
        }

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            return SaveAnswerResponse.builder()
                    .autosubmitted(true)
                    .message("Attempt is already submitted.")
                    .build();
        }

        // Server-side time validation
        long elapsedSeconds = Duration.between(attempt.getStartedAt(), Instant.now()).toSeconds();
        long totalDurationSeconds = attempt.getExam().getDurationMinutes() * 60L;
        if (elapsedSeconds > totalDurationSeconds + 60L) { // 60s grace
            log.warn("Attempted save after expiration for attempt {}. Performing auto-submit.", attemptId);
            submitAttemptInternal(attempt, userId, "AUTO_SUBMITTED", "127.0.0.1", "System Auto-Submit");
            return SaveAnswerResponse.builder()
                    .autosubmitted(true)
                    .message("Exam session has expired and has been submitted.")
                    .build();
        }

        CandidateAnswer answer = candidateAnswerRepository.findByAttemptIdAndQuestionId(attemptId, request.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("Question does not belong to this exam attempt"));

        answer.setSelectedOption(request.getSelectedOption());
        answer.setNumericalAnswer(request.getNumericalAnswer());
        answer.setStatus(request.getStatus());
        candidateAnswerRepository.save(answer);

        return SaveAnswerResponse.builder()
                .autosubmitted(false)
                .message("Answer saved successfully.")
                .build();
    }

    @Transactional
    public void submitAttempt(UUID attemptId, UUID userId, String ipAddress, String userAgent) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));
        submitAttemptInternal(attempt, userId, "SUBMITTED", ipAddress, userAgent);
    }

    @Transactional
    public void submitAttemptInternal(ExamAttempt attempt, UUID userId, String targetStatus, String ipAddress, String userAgent) {
        if (!attempt.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized attempt submission");
        }

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            log.info("Attempt {} is already submitted", attempt.getId());
            return;
        }

        List<CandidateAnswer> answers = candidateAnswerRepository.findByAttempt(attempt);

        int totalCorrect = 0;
        int totalIncorrect = 0;
        int totalUnattempted = 0;

        double physicsScore = 0.0;
        double chemistryScore = 0.0;
        double mathsScore = 0.0;

        long seed = attempt.getShuffleSeed() != null ? attempt.getShuffleSeed() : 0L;

        for (CandidateAnswer answer : answers) {
            Question q = answer.getQuestion();
            boolean answered = false;
            boolean correct = false;

            if ("MCQ".equals(q.getQuestionType()) || "MULTIPLE_CHOICE".equals(q.getQuestionType())) {
                String originalSelectedMapped = mapSelectedOptionBack(answer.getSelectedOption(), q, seed);
                if (originalSelectedMapped != null && !originalSelectedMapped.trim().isEmpty()) {
                    answered = true;
                    if (originalSelectedMapped.equalsIgnoreCase(q.getCorrectOption())) {
                        correct = true;
                    }
                }
            } else if ("NUMERICAL".equals(q.getQuestionType())) {
                if (answer.getNumericalAnswer() != null) {
                    answered = true;
                    if (Math.abs(answer.getNumericalAnswer() - q.getCorrectNumericalValue()) < 0.001) {
                        correct = true;
                    }
                }
            }

            double questionScore = 0.0;
            if (answered) {
                if (correct) {
                    questionScore = q.getMarkingPositive();
                    totalCorrect++;
                } else {
                    questionScore = -q.getMarkingNegative();
                    totalIncorrect++;
                }
            } else {
                totalUnattempted++;
            }

            if ("PHYSICS".equalsIgnoreCase(q.getSubject())) {
                physicsScore += questionScore;
            } else if ("CHEMISTRY".equalsIgnoreCase(q.getSubject())) {
                chemistryScore += questionScore;
            } else if ("MATHEMATICS".equalsIgnoreCase(q.getSubject())) {
                mathsScore += questionScore;
            }
        }

        double totalScore = physicsScore + chemistryScore + mathsScore;
        double percentage = (totalScore / attempt.getExam().getTotalMarks()) * 100.0;
        double percentile = Math.min(100.0, Math.max(0.0, 90.0 + (percentage / 10.0)));

        attempt.setStatus(targetStatus);
        attempt.setSubmittedAt(Instant.now());
        attempt.setScore(totalScore);
        attempt.setPercentage(Math.round(percentage * 100.0) / 100.0);
        attempt.setRankPosition(15); // Mock rank index
        attemptRepository.save(attempt);

        String feedback = String.format("Completed with %d correct, %d incorrect. ", totalCorrect, totalIncorrect);
        if (percentage >= 80.0) {
            feedback += "Excellent performance! Keep up the momentum.";
        } else if (percentage >= 50.0) {
            feedback += "Strong performance. Focus on minimizing negative marks.";
        } else {
            feedback += "Keep practicing core concepts. Review wrong attempts.";
        }

        ExamResult result = ExamResult.builder()
                .attempt(attempt)
                .totalCorrect(totalCorrect)
                .totalIncorrect(totalIncorrect)
                .totalUnattempted(totalUnattempted)
                .physicsScore(physicsScore)
                .chemistryScore(chemistryScore)
                .mathsScore(mathsScore)
                .percentile(Math.round(percentile * 100.0) / 100.0)
                .feedbackSummary(feedback)
                .build();
        resultRepository.save(result);

        Notification notification = Notification.builder()
                .user(attempt.getUser())
                .title("Exam Scorecard Available")
                .message("Your attempt for " + attempt.getExam().getTitle() + " has been successfully submitted and scored.")
                .type("RESULT_DECLARED")
                .read(false)
                .build();
        notificationRepository.save(notification);

        auditLogService.log(attempt.getUser().getId(), "EXAM_SUBMITTED", "Submitted exam attempt: " + attempt.getId() + " with status: " + targetStatus + " | Score: " + totalScore, ipAddress, userAgent);
    }

    private String mapSelectedOptionBack(String selectedOptionShuffled, Question q, long seed) {
        if (selectedOptionShuffled == null || selectedOptionShuffled.trim().isEmpty()) {
            return null;
        }

        String[] selectedLetters = selectedOptionShuffled.split(",");
        List<String> originalLetters = List.of("A", "B", "C", "D");
        List<String> originalOptions = List.of(q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD());

        List<String> shuffledOptions = new java.util.ArrayList<>(originalOptions);
        long qSeed = seed + q.getId().hashCode();
        java.util.Collections.shuffle(shuffledOptions, new java.util.Random(qSeed));

        List<String> mappedLetters = new java.util.ArrayList<>();
        for (String letter : selectedLetters) {
            int indexShuffled = originalLetters.indexOf(letter.trim().toUpperCase());
            if (indexShuffled >= 0 && indexShuffled < shuffledOptions.size()) {
                String text = shuffledOptions.get(indexShuffled);
                int originalIndex = originalOptions.indexOf(text);
                if (originalIndex >= 0) {
                    mappedLetters.add(originalLetters.get(originalIndex));
                }
            }
        }

        java.util.Collections.sort(mappedLetters);
        return String.join(",", mappedLetters);
    }
}
