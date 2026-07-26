package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.dto.dashboard.StudentDashboardSummaryDto;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.StudentDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT', 'EXAMINER', 'ADMIN')")
public class StudentDashboardController {

    private final StudentDashboardService studentDashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<StudentDashboardSummaryDto>> getDashboardSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        StudentDashboardSummaryDto summary = studentDashboardService.getStudentDashboardSummary(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
