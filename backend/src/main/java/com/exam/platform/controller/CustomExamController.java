package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.CustomExamGeneratorService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/custom-exams")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT', 'EXAMINER', 'ADMIN')")
public class CustomExamController {

    private final CustomExamGeneratorService customExamGeneratorService;

    @Data
    public static class AiMockTestRequest {
        private String category; // JEE, SSC, NEET, BANKING, GATE, UPSC
        private String subject;
        private String difficulty; // EASY, MEDIUM, HARD
        private int questionCount;
        private int durationMinutes;
    }

    @PostMapping("/upload-document")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadDocumentExam(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "GENERAL") String category,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "durationMinutes", defaultValue = "60") int durationMinutes,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) throws Exception {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Document file cannot be empty");
        }

        if (file.getSize() > 15 * 1024 * 1024) {
            throw new IllegalArgumentException("Uploaded document size exceeds maximum allowed limit of 15 MB");
        }

        String origFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!origFilename.endsWith(".pdf") && !origFilename.endsWith(".docx")) {
            throw new IllegalArgumentException("Invalid file format. Only PDF (.pdf) and Microsoft Word (.docx) documents are supported.");
        }

        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");

        ExamAttempt attempt = customExamGeneratorService.createExamFromDocument(
                file, category, title, durationMinutes, userDetails.getId(), ipAddress, userAgent
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Document parsed successfully! Custom CBT test generated.",
                Map.of(
                        "attemptId", attempt.getId(),
                        "examId", attempt.getExam().getId(),
                        "examTitle", attempt.getExam().getTitle(),
                        "totalQuestions", attempt.getExam().getTotalQuestions()
                )
        ));
    }

    @PostMapping("/generate-mock")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateAiMockTest(
            @RequestBody AiMockTestRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");

        ExamAttempt attempt = customExamGeneratorService.generateAiMockTest(
                request.getCategory() != null ? request.getCategory() : "JEE",
                request.getSubject() != null ? request.getSubject() : "General",
                request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM",
                request.getQuestionCount() > 0 ? request.getQuestionCount() : 15,
                request.getDurationMinutes() > 0 ? request.getDurationMinutes() : 60,
                userDetails.getId(),
                ipAddress,
                userAgent
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Instant mock test generated successfully for " + request.getCategory() + "!",
                Map.of(
                        "attemptId", attempt.getId(),
                        "examId", attempt.getExam().getId(),
                        "examTitle", attempt.getExam().getTitle(),
                        "totalQuestions", attempt.getExam().getTotalQuestions()
                )
        ));
    }
}
