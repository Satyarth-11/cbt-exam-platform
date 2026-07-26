package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.dto.admin.AdminResetPasswordRequest;
import com.exam.platform.dto.admin.ExamRequestDto;
import com.exam.platform.dto.admin.QuestionRequestDto;
import com.exam.platform.dto.admin.UserRoleUpdateRequest;
import com.exam.platform.dto.auth.AdminCreateUserRequest;
import com.exam.platform.dto.auth.UserProfileResponse;
import com.exam.platform.dto.dashboard.ExamSummaryDto;
import com.exam.platform.entity.Question;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.AdminManagementService;
import com.exam.platform.service.AuthService;
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
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
public class AdminController {

    private final AuthService authService;
    private final AdminManagementService adminManagementService;

    // --- USER MANAGEMENT ENDPOINTS ---

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserProfileResponse>> createAdminUser(
            @Valid @RequestBody AdminCreateUserRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        UserProfileResponse userProfile = authService.createAdminUser(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("User created successfully with assigned role", userProfile));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        List<UserProfileResponse> users = adminManagementService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<UserProfileResponse>> toggleUserStatus(
            @PathVariable UUID userId,
            @RequestParam("active") boolean active,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserProfileResponse user = adminManagementService.toggleUserStatus(userId, active, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", user));
    }

    @PutMapping("/users/{userId}/roles")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUserRoles(
            @PathVariable UUID userId,
            @Valid @RequestBody UserRoleUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserProfileResponse user = adminManagementService.updateUserRoles(userId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("User roles updated successfully", user));
    }

    @PostMapping("/users/{userId}/reset-password")
    public ResponseEntity<ApiResponse<String>> adminResetPassword(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminResetPasswordRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        adminManagementService.adminResetPassword(userId, request.getNewPassword(), userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully"));
    }

    // --- EXAM LIFECYCLE ENDPOINTS ---

    @GetMapping("/exams")
    public ResponseEntity<ApiResponse<List<ExamSummaryDto>>> getAllExams() {
        List<ExamSummaryDto> exams = adminManagementService.getAllExams();
        return ResponseEntity.ok(ApiResponse.success(exams));
    }

    @GetMapping("/exams/{examId}")
    public ResponseEntity<ApiResponse<ExamSummaryDto>> getExamById(@PathVariable UUID examId) {
        ExamSummaryDto exam = adminManagementService.getExamById(examId);
        return ResponseEntity.ok(ApiResponse.success(exam));
    }

    @PostMapping("/exams")
    public ResponseEntity<ApiResponse<ExamSummaryDto>> createExam(
            @Valid @RequestBody ExamRequestDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ExamSummaryDto exam = adminManagementService.createExam(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Exam created successfully", exam));
    }

    @PutMapping("/exams/{examId}")
    public ResponseEntity<ApiResponse<ExamSummaryDto>> updateExam(
            @PathVariable UUID examId,
            @Valid @RequestBody ExamRequestDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ExamSummaryDto exam = adminManagementService.updateExam(examId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Exam updated successfully", exam));
    }

    @DeleteMapping("/exams/{examId}")
    public ResponseEntity<ApiResponse<String>> deleteExam(
            @PathVariable UUID examId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        adminManagementService.deleteExam(examId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Exam deleted successfully"));
    }

    // --- QUESTION BANK BUILDER ENDPOINTS ---

    @GetMapping("/exams/{examId}/questions")
    public ResponseEntity<ApiResponse<List<Question>>> getQuestionsForExam(@PathVariable UUID examId) {
        List<Question> questions = adminManagementService.getQuestionsForExam(examId);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @PostMapping("/exams/{examId}/questions")
    public ResponseEntity<ApiResponse<Question>> addQuestionToExam(
            @PathVariable UUID examId,
            @Valid @RequestBody QuestionRequestDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Question question = adminManagementService.addQuestionToExam(examId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question added successfully", question));
    }

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponse<Question>> updateQuestion(
            @PathVariable UUID questionId,
            @Valid @RequestBody QuestionRequestDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Question question = adminManagementService.updateQuestion(questionId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", question));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponse<String>> deleteQuestion(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        adminManagementService.deleteQuestion(questionId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully"));
    }
}
