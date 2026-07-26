package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.dto.analytics.DetailedScorecardDto;
import com.exam.platform.dto.analytics.ExamAnalyticsReportDto;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/student/attempts/{attemptId}/scorecard")
    @PreAuthorize("hasAnyRole('STUDENT', 'EXAMINER', 'ADMIN')")
    public ResponseEntity<ApiResponse<DetailedScorecardDto>> getCandidateScorecard(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_EXAMINER"));

        DetailedScorecardDto scorecard = analyticsService.getDetailedScorecard(attemptId, userDetails.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(scorecard));
    }

    @GetMapping("/admin/analytics/exams/{examId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<ApiResponse<ExamAnalyticsReportDto>> getExamAnalyticsReport(
            @PathVariable UUID examId
    ) {
        ExamAnalyticsReportDto report = analyticsService.getExamAnalyticsReport(examId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/admin/analytics/exams/{examId}/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
    public ResponseEntity<String> exportExamResultsCsv(
            @PathVariable UUID examId
    ) {
        String csvData = analyticsService.exportExamResultsCsv(examId);
        String filename = "exam_results_" + examId + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
