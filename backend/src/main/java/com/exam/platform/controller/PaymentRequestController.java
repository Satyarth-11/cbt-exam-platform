package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.PaperCreditsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PaymentRequestController {

    private final PaperCreditsService paperCreditsService;

    @Data
    public static class ApproveClaimRequest {
        private int confirmedCredits;
        private BigDecimal confirmedAmountInr;
        private String adminNotes;
    }

    @Data
    public static class RejectClaimRequest {
        private String reason;
    }

    @Data
    public static class DirectCreditGrantRequest {
        private int credits;
        private String reason;
    }

    @Data
    public static class UnlimitedAccessRequest {
        private boolean enabled;
        private String reason;
    }

    @GetMapping("/payment-requests")
    public ResponseEntity<ApiResponse<List<PaperCreditsService.PaymentRequestDto>>> getAllPaymentRequests() {
        List<PaperCreditsService.PaymentRequestDto> list = paperCreditsService.getPendingAndAllPaymentRequests();
        return ResponseEntity.ok(ApiResponse.success("Payment requests list fetched", list));
    }

    @PostMapping("/payment-requests/{id}/approve")
    public ResponseEntity<ApiResponse<PaperCreditsService.PaymentRequestDto>> approvePaymentRequest(
            @PathVariable UUID id,
            @RequestBody ApproveClaimRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String ua = servletRequest.getHeader("User-Agent");

        PaperCreditsService.PaymentRequestDto dto = paperCreditsService.approvePaymentRequest(
                id,
                userDetails.getId(),
                request.getConfirmedCredits(),
                request.getConfirmedAmountInr(),
                request.getAdminNotes(),
                ip,
                ua
        );

        return ResponseEntity.ok(ApiResponse.success("Payment request approved and credits granted", dto));
    }

    @PostMapping("/payment-requests/{id}/reject")
    public ResponseEntity<ApiResponse<PaperCreditsService.PaymentRequestDto>> rejectPaymentRequest(
            @PathVariable UUID id,
            @RequestBody RejectClaimRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String ua = servletRequest.getHeader("User-Agent");

        PaperCreditsService.PaymentRequestDto dto = paperCreditsService.rejectPaymentRequest(
                id,
                userDetails.getId(),
                request.getReason(),
                ip,
                ua
        );

        return ResponseEntity.ok(ApiResponse.success("Payment request rejected", dto));
    }

    @PostMapping("/users/{userId}/credits/grant")
    public ResponseEntity<ApiResponse<String>> grantCreditsDirectly(
            @PathVariable UUID userId,
            @RequestBody DirectCreditGrantRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String ua = servletRequest.getHeader("User-Agent");

        paperCreditsService.grantCredits(
                userId,
                request.getCredits(),
                request.getReason() != null ? request.getReason() : "Admin direct grant",
                userDetails.getId(),
                ip,
                ua
        );

        return ResponseEntity.ok(ApiResponse.success("Successfully granted " + request.getCredits() + " credits to candidate.", "OK"));
    }

    @PostMapping("/users/{userId}/credits/revoke")
    public ResponseEntity<ApiResponse<String>> revokeCreditsDirectly(
            @PathVariable UUID userId,
            @RequestBody DirectCreditGrantRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String ua = servletRequest.getHeader("User-Agent");

        paperCreditsService.revokeCredits(
                userId,
                request.getCredits(),
                request.getReason() != null ? request.getReason() : "Admin direct revocation",
                userDetails.getId(),
                ip,
                ua
        );

        return ResponseEntity.ok(ApiResponse.success("Successfully revoked " + request.getCredits() + " credits from candidate.", "OK"));
    }

    @PostMapping("/users/{userId}/unlimited-access")
    public ResponseEntity<ApiResponse<String>> toggleUnlimitedAccess(
            @PathVariable UUID userId,
            @RequestBody UnlimitedAccessRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String ua = servletRequest.getHeader("User-Agent");

        paperCreditsService.setUnlimitedAccess(
                userId,
                request.isEnabled(),
                request.getReason() != null ? request.getReason() : "Admin VIP pass toggle",
                userDetails.getId(),
                ip,
                ua
        );

        return ResponseEntity.ok(ApiResponse.success("Successfully updated unlimited access status to " + request.isEnabled(), "OK"));
    }
}
