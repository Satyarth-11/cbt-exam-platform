package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.dto.engine.*;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.ExamEngineService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT', 'EXAMINER', 'ADMIN')")
public class ExamEngineController {

    private final ExamEngineService examEngineService;

    @PostMapping("/exams/{examId}/start")
    public ResponseEntity<ApiResponse<StartExamResponse>> startExam(
            @PathVariable UUID examId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        StartExamResponse response = examEngineService.startAttempt(examId, userDetails.getId(), ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Exam attempt started successfully", response));
    }

    @GetMapping("/attempts/{attemptId}/session")
    public ResponseEntity<ApiResponse<ExamSessionDto>> getExamSession(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ExamSessionDto session = examEngineService.getExamSession(attemptId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PostMapping("/attempts/{attemptId}/save")
    public ResponseEntity<ApiResponse<SaveAnswerResponse>> saveAnswer(
            @PathVariable UUID attemptId,
            @Valid @RequestBody SaveAnswerRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        SaveAnswerResponse response = examEngineService.saveAnswer(attemptId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<ApiResponse<String>> submitExam(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        examEngineService.submitAttempt(attemptId, userDetails.getId(), ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Exam attempt submitted successfully"));
    }
}
