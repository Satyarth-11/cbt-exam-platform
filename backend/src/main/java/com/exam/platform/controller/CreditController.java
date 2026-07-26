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

import java.util.List;

@RestController
@RequestMapping("/api/v1/student/credits")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT', 'EXAMINER', 'ADMIN')")
public class CreditController {

    private final PaperCreditsService paperCreditsService;

    @Data
    public static class ClaimPurchaseRequest {
        private String bundleKey; // STARTER, POPULAR, BEST_VALUE
        private String utrReference;
    }

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<PaperCreditsService.CreditBalanceDto>> getCreditBalance(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        PaperCreditsService.CreditBalanceDto balance = paperCreditsService.getUserCreditBalance(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Credit balance fetched", balance));
    }

    @PostMapping("/purchase-request")
    public ResponseEntity<ApiResponse<PaperCreditsService.PaymentRequestDto>> submitPurchaseRequest(
            @RequestBody ClaimPurchaseRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String ua = servletRequest.getHeader("User-Agent");

        PaperCreditsService.PaymentRequestDto dto = paperCreditsService.submitPaymentRequest(
                userDetails.getId(),
                request.getBundleKey(),
                request.getUtrReference(),
                ip,
                ua
        );

        return ResponseEntity.ok(ApiResponse.success("Payment claim submitted successfully", dto));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<PaperCreditsService.PaymentRequestDto>>> getMyPaymentRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<PaperCreditsService.PaymentRequestDto> list = paperCreditsService.getStudentPaymentRequests(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment requests fetched", list));
    }
}
