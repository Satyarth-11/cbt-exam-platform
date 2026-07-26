package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.dto.auth.*;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        TokenResponse tokenResponse = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Login successful", tokenResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        TokenResponse tokenResponse = authService.refreshToken(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", tokenResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserProfileResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        UserProfileResponse userProfile = authService.register(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully. Please verify your email.", userProfile));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        authService.verifyEmail(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Email address successfully verified."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        authService.forgotPassword(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("If an account exists for this email, password reset instructions have been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        authService.resetPassword(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully. Please log in with your new password."));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) UUID sessionId,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        UUID userId = userDetails != null ? userDetails.getId() : null;
        authService.logout(sessionId, userId, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Logout successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserProfileResponse userProfile = authService.getUserProfile(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(userProfile));
    }
}
