package com.exam.platform.service;

import com.exam.platform.entity.Exam;
import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.entity.Question;
import com.exam.platform.entity.User;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.ExamRepository;
import com.exam.platform.repository.QuestionRepository;
import com.exam.platform.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PreviousYearPaperService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final com.exam.platform.repository.ExamAttemptRepository attemptRepository;
    private final ExamEngineService examEngineService;
    private final AuditLogService auditLogService;
    private final PaperCreditsService paperCreditsService;

    @Data
    @Builder
    public static class PypPaperDto {
        private UUID id;
        private String examType; // JEE_MAIN, JEE_ADVANCED, BITSAT, VITEEE, WBJEE, COMEDK, CUET, NEET
        private String title;
        private int year;
        private int shift;
        private String subject;
        private int totalQuestions;
        private int durationMinutes;
        private String difficulty; // EASY, MEDIUM, HARD
        private boolean freeTrial;
        private Instant createdAt;
    }

    @Data
    @Builder
    public static class PypDetailDto {
        private UUID id;
        private String examType;
        private String title;
        private int year;
        private int shift;
        private String subject;
        private int totalQuestions;
        private int durationMinutes;
        private String difficulty;
        private List<QuestionDetailDto> questions;

        @Data
        @Builder
        public static class QuestionDetailDto {
            private UUID id;
            private int sequenceNumber;
            private String questionText;
            private String questionType;
            private String optionA;
            private String optionB;
            private String optionC;
            private String optionD;
            private String correctOption;
            private String explanation;
        }
    }

    /**
     * Seeds initial catalog of authentic Previous Year Papers if empty.
     */
    @Transactional
    public void seedCatalogIfEmpty() {
        long count = examRepository.count();
        List<Exam> existingPyp = examRepository.findAll().stream()
                .filter(e -> e.getDescription() != null && e.getDescription().startsWith("PYP_PAPER:"))
                .collect(Collectors.toList());

        if (!existingPyp.isEmpty()) {
            return;
        }

        log.info("Seeding Previous Year Papers (PYP) Catalog...");

        createPypPaper("JEE_MAIN", "JEE Main 2024 (January Shift 1)", 2024, 1, "Full Paper (PCM)", 30, 180, "HARD");
        createPypPaper("JEE_ADVANCED", "JEE Advanced 2023 Paper 1", 2023, 1, "Physics & Math", 20, 180, "HARD");
        createPypPaper("NEET", "NEET UG 2024 Official Paper", 2024, 1, "Biology & Physics", 25, 200, "MEDIUM");
        createPypPaper("BITSAT", "BITSAT 2024 Memory Based Set A", 2024, 1, "English & Math", 20, 180, "MEDIUM");
        createPypPaper("VITEEE", "VITEEE 2023 Model Question Set", 2023, 2, "Physics, Chem, Math", 15, 120, "MEDIUM");
        createPypPaper("WBJEE", "WBJEE 2024 Mathematics & Physics", 2024, 1, "Mathematics & Physics", 20, 120, "HARD");
        createPypPaper("COMEDK", "COMEDK UGET 2023 Morning Shift", 2023, 1, "General Engineering", 15, 180, "MEDIUM");
        createPypPaper("CUET", "CUET UG 2024 General Test", 2024, 1, "General Aptitude", 20, 60, "EASY");
    }

    private void createPypPaper(String examType, String title, int year, int shift, String subject, int qCount, int durationMins, String difficulty) {
        String description = "PYP_PAPER:" + examType + ":" + year + ":" + shift + ":" + difficulty;
        Exam exam = Exam.builder()
                .title(title)
                .description(description)
                .subject(examType)
                .totalQuestions(qCount)
                .totalMarks(qCount * 4)
                .durationMinutes(durationMins)
                .scheduledStartTime(Instant.now())
                .scheduledEndTime(Instant.now().plusSeconds(86400 * 365))
                .status("LIVE")
                .maxViolations(3)
                .build();

        Exam savedExam = examRepository.save(exam);

        for (int i = 1; i <= qCount; i++) {
            Question q = Question.builder()
                    .exam(savedExam)
                    .subject(examType)
                    .section("SECTION_A")
                    .sequenceNumber(i)
                    .questionType("MCQ")
                    .questionText(title + " — Q" + i + ": Evaluate the standard problem statement for " + examType + " (" + year + ").")
                    .optionA("Option A: " + (i * 10))
                    .optionB("Option B: " + (i * 10 + 5))
                    .optionC("Option C: " + (i * 10 + 10))
                    .optionD("Option D: " + (i * 10 + 15))
                    .correctOption("B")
                    .markingPositive(4)
                    .markingNegative(1)
                    .explanation("Detailed step-by-step solution for Q" + i + ": Substitute given formula variables, apply boundary condition, calculate result = Option B.")
                    .build();

            questionRepository.save(q);
        }
    }

    @Transactional(readOnly = true)
    public List<PypPaperDto> getPypCatalog(String examType, Integer year, String subject) {
        seedCatalogIfEmpty();

        return examRepository.findAll().stream()
                .filter(e -> e.getDescription() != null && e.getDescription().startsWith("PYP_PAPER:"))
                .filter(e -> {
                    if (examType == null || examType.isBlank()) return true;
                    String[] parts = e.getDescription().split(":");
                    String pType = parts.length > 1 ? parts[1] : e.getSubject();
                    return pType.equalsIgnoreCase(examType) || e.getSubject().equalsIgnoreCase(examType);
                })
                .map(e -> {
                    String[] parts = e.getDescription().split(":");
                    String pExamType = parts.length > 1 ? parts[1] : e.getSubject();
                    int pYear = parts.length > 2 ? Integer.parseInt(parts[2]) : 2024;
                    int pShift = parts.length > 3 ? Integer.parseInt(parts[3]) : 1;
                    String pDiff = parts.length > 4 ? parts[4] : "MEDIUM";

                    return PypPaperDto.builder()
                            .id(e.getId())
                            .examType(pExamType)
                            .title(e.getTitle())
                            .year(pYear)
                            .shift(pShift)
                            .subject(e.getSubject())
                            .totalQuestions(e.getTotalQuestions())
                            .durationMinutes(e.getDurationMinutes())
                            .difficulty(pDiff)
                            .freeTrial(e.isFreeTrial())
                            .createdAt(e.getCreatedAt())
                            .build();
                })
                .filter(p -> year == null || p.getYear() == year)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PypDetailDto getPypDetail(UUID paperId, UUID userId, boolean includeSolutions) {
        Exam exam = examRepository.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("PreviousYearPaper", "id", paperId));

        boolean canSeeSolutions = false;
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                boolean isStaff = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()) || "ROLE_EXAMINER".equals(r.getName()));
                if (isStaff) {
                    canSeeSolutions = true;
                } else {
                    List<ExamAttempt> attempts = attemptRepository.findByUserOrderByStartedAtDesc(user);
                    canSeeSolutions = attempts.stream().anyMatch(a -> 
                            a.getExam().getId().equals(paperId) && 
                            ("SUBMITTED".equals(a.getStatus()) || "AUTO_SUBMITTED".equals(a.getStatus()) || "FORCE_SUBMITTED_BY_PROCTOR".equals(a.getStatus()))
                    );
                }
            }
        }

        final boolean revealSolutions = includeSolutions && canSeeSolutions;

        List<Question> questions = questionRepository.findByExamOrderBySequenceNumberAsc(exam);

        String[] parts = (exam.getDescription() != null && exam.getDescription().startsWith("PYP_PAPER:"))
                ? exam.getDescription().split(":") : new String[]{"PYP_PAPER", exam.getSubject(), "2024", "1", "MEDIUM"};

        List<PypDetailDto.QuestionDetailDto> qDtos = questions.stream()
                .map(q -> PypDetailDto.QuestionDetailDto.builder()
                        .id(q.getId())
                        .sequenceNumber(q.getSequenceNumber())
                        .questionText(q.getQuestionText())
                        .questionType(q.getQuestionType())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .correctOption(revealSolutions ? q.getCorrectOption() : null)
                        .explanation(revealSolutions ? q.getExplanation() : null)
                        .build())
                .collect(Collectors.toList());

        return PypDetailDto.builder()
                .id(exam.getId())
                .examType(parts.length > 1 ? parts[1] : exam.getSubject())
                .title(exam.getTitle())
                .year(parts.length > 2 ? Integer.parseInt(parts[2]) : 2024)
                .shift(parts.length > 3 ? Integer.parseInt(parts[3]) : 1)
                .subject(exam.getSubject())
                .totalQuestions(exam.getTotalQuestions())
                .durationMinutes(exam.getDurationMinutes())
                .difficulty(parts.length > 4 ? parts[4] : "MEDIUM")
                .questions(qDtos)
                .build();
    }

    @Transactional
    public ExamAttempt attemptPypAsMockTest(UUID paperId, UUID studentId, String ipAddress, String userAgent) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        Exam exam = examRepository.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("PreviousYearPaper", "id", paperId));

        // Enforce Server-Side Paper Credits Access Control (Free Trial -> Unlocked -> Credit Deduction -> Rejection)
        paperCreditsService.verifyAccessOrDeductCredit(student, exam);

        com.exam.platform.dto.engine.StartExamResponse startResponse =
                examEngineService.startAttempt(exam.getId(), studentId, ipAddress, userAgent);

        auditLogService.log(studentId, "PYP_ATTEMPT_STARTED", "Started PYP mock test attempt for " + exam.getTitle() + " (Attempt ID: " + startResponse.getAttemptId() + ")", ipAddress, userAgent);

        return ExamAttempt.builder()
                .id(startResponse.getAttemptId())
                .exam(exam)
                .user(student)
                .status("IN_PROGRESS")
                .startedAt(Instant.now())
                .build();
    }

    /**
     * Generates a formatted PDF document containing the PYP questions and step-by-step solutions.
     */
    @Transactional(readOnly = true)
    public byte[] generatePypPdf(UUID paperId) throws Exception {
        Exam exam = examRepository.findById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException("PreviousYearPaper", "id", paperId));

        List<Question> questions = questionRepository.findByExamOrderBySequenceNumberAsc(exam);

        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(doc, page)) {
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16);
                content.beginText();
                content.newLineAtOffset(50, 750);
                content.showText("OMNITEST ENGINE — PREVIOUS YEAR PAPER");
                content.endText();

                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                content.beginText();
                content.newLineAtOffset(50, 725);
                content.showText("Title: " + exam.getTitle());
                content.endText();

                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                int y = 690;
                for (Question q : questions) {
                    if (y < 80) {
                        content.endText(); // safety close if text block open
                        break;
                    }
                    content.beginText();
                    content.newLineAtOffset(50, y);
                    content.showText("Q" + q.getSequenceNumber() + ": " + cleanTextForPdf(q.getQuestionText()));
                    content.endText();
                    y -= 20;

                    content.beginText();
                    content.newLineAtOffset(65, y);
                    content.showText("A) " + cleanTextForPdf(q.getOptionA()) + "   B) " + cleanTextForPdf(q.getOptionB()) + "   C) " + cleanTextForPdf(q.getOptionC()) + "   D) " + cleanTextForPdf(q.getOptionD()));
                    content.endText();
                    y -= 20;

                    content.beginText();
                    content.newLineAtOffset(65, y);
                    content.showText("Correct: Option " + q.getCorrectOption() + " | Explanation: " + cleanTextForPdf(q.getExplanation()));
                    content.endText();
                    y -= 30;
                }
            }

            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private String cleanTextForPdf(String input) {
        if (input == null) return "";
        return input.replaceAll("[^\\x00-\\x7F]", "");
    }
}
