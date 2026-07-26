package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.dto.proctor.AttemptProctorStatusDto;
import com.exam.platform.dto.proctor.ProctorViolationRequest;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.ProctoringService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProctoringController {

    private final ProctoringService proctoringService;

    @PostMapping("/student/attempts/{attemptId}/violations")
    @PreAuthorize("hasAnyRole('STUDENT', 'EXAMINER', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.exam.platform.dto.proctor.ViolationLogResponse>> logViolation(
            @PathVariable UUID attemptId,
            @Valid @RequestBody ProctorViolationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        com.exam.platform.dto.proctor.ViolationLogResponse response = 
                proctoringService.logViolation(attemptId, request, userDetails.getId(), ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Violation processed", response));
    }

    @GetMapping("/admin/proctor/sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<ApiResponse<List<AttemptProctorStatusDto>>> getActiveProctorSessions() {
        List<AttemptProctorStatusDto> sessions = proctoringService.getActiveProctorSessions();
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/admin/attempts/{attemptId}/violations")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<ApiResponse<List<AttemptProctorStatusDto.ViolationDetailDto>>> getAttemptViolations(
            @PathVariable UUID attemptId
    ) {
        List<AttemptProctorStatusDto.ViolationDetailDto> violations = proctoringService.getAttemptViolations(attemptId);
        return ResponseEntity.ok(ApiResponse.success(violations));
    }

    @PostMapping("/admin/proctor/attempts/{attemptId}/pause")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<ApiResponse<String>> pauseAttempt(
            @PathVariable UUID attemptId,
            @RequestParam(value = "reason", defaultValue = "Proctor intervention") String reason,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        proctoringService.pauseAttempt(attemptId, userDetails.getId(), reason, servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success("Exam attempt paused successfully."));
    }

    @PostMapping("/admin/proctor/attempts/{attemptId}/resume")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<ApiResponse<String>> resumeAttempt(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        proctoringService.resumeAttempt(attemptId, userDetails.getId(), servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success("Exam attempt resumed successfully."));
    }

    @PostMapping("/admin/proctor/attempts/{attemptId}/force-submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<ApiResponse<String>> forceSubmitAttempt(
            @PathVariable UUID attemptId,
            @RequestParam(value = "reason", defaultValue = "Proctor force submission") String reason,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        proctoringService.forceSubmitAttempt(attemptId, userDetails.getId(), reason, servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success("Exam attempt force-submitted successfully."));
    }

    @PostMapping("/admin/proctor/attempts/{attemptId}/block")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<ApiResponse<String>> blockStudent(
            @PathVariable UUID attemptId,
            @RequestParam(value = "reason", defaultValue = "Severe cheating violations") String reason,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        proctoringService.blockStudent(attemptId, userDetails.getId(), reason, servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success("Candidate blocked and attempt terminated."));
    }

    @PostMapping("/admin/proctor/attempts/{attemptId}/warning")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<ApiResponse<String>> sendWarning(
            @PathVariable UUID attemptId,
            @RequestParam("message") String message,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        proctoringService.sendWarning(attemptId, userDetails.getId(), message, servletRequest.getRemoteAddr(), servletRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success("Warning message pushed to candidate."));
    }
}
