package com.exam.platform.service;

import com.exam.platform.entity.Exam;
import com.exam.platform.entity.PaperUnlock;
import com.exam.platform.entity.PaymentRequest;
import com.exam.platform.entity.User;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.ExamRepository;
import com.exam.platform.repository.PaperUnlockRepository;
import com.exam.platform.repository.PaymentRequestRepository;
import com.exam.platform.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaperCreditsService {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final PaperUnlockRepository paperUnlockRepository;
    private final PaymentRequestRepository paymentRequestRepository;
    private final TelegramNotifierService telegramNotifierService;
    private final AuditLogService auditLogService;

    @Data
    @Builder
    public static class CreditBalanceDto {
        private UUID userId;
        private int paperCredits;
        private boolean hasUnlimitedAccess;
        private List<UUID> unlockedPaperIds;
    }

    @Data
    @Builder
    public static class PaymentRequestDto {
        private UUID id;
        private UUID userId;
        private String studentName;
        private String studentEmail;
        private int creditsClaimed;
        private BigDecimal amountClaimedInr;
        private String orderReference;
        private String utrReference;
        private String status;
        private String adminNotes;
        private Instant createdAt;
        private Instant reviewedAt;
    }

    @Transactional(readOnly = true)
    public CreditBalanceDto getUserCreditBalance(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<UUID> unlockedIds = paperUnlockRepository.findByUser(user).stream()
                .map(u -> u.getExam().getId())
                .collect(Collectors.toList());

        return CreditBalanceDto.builder()
                .userId(user.getId())
                .paperCredits(user.getPaperCredits() != null ? user.getPaperCredits() : 0)
                .hasUnlimitedAccess(user.isHasUnlimitedAccess())
                .unlockedPaperIds(unlockedIds)
                .build();
    }

    /**
     * Submit manual UPI payment claim request.
     */
    @Transactional
    public PaymentRequestDto submitPaymentRequest(UUID studentId, String bundleKey, String utrReference, String ip, String ua) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        int credits;
        BigDecimal amount;

        switch (bundleKey.toUpperCase()) {
            case "STARTER":
                credits = 2;
                amount = new BigDecimal("40.00");
                break;
            case "POPULAR":
                credits = 5;
                amount = new BigDecimal("80.00");
                break;
            case "BEST_VALUE":
                credits = 10;
                amount = new BigDecimal("100.00");
                break;
            default:
                throw new IllegalArgumentException("Invalid credit bundle selected: " + bundleKey);
        }

        String orderRef = "ORD-" + (100000 + new Random().nextInt(900000));

        PaymentRequest request = PaymentRequest.builder()
                .user(student)
                .creditsClaimed(credits)
                .amountClaimedInr(amount)
                .orderReference(orderRef)
                .utrReference(utrReference != null ? utrReference.trim() : null)
                .status("PENDING")
                .build();

        PaymentRequest saved = paymentRequestRepository.save(request);

        auditLogService.log(studentId, "PAYMENT_CLAIM_SUBMITTED", "Submitted payment claim for " + credits + " credits (Order: " + orderRef + ")", ip, ua);

        // Async Telegram notification to Admin
        telegramNotifierService.sendPaymentClaimNotification(
            student.getFirstName() + " " + student.getLastName(),
            student.getEmail(),
            credits,
            amount,
            orderRef,
            utrReference
        );

        return mapToDto(saved);
    }

    /**
     * Decoupled credit granting method.
     * Can be invoked by Admin manual approval OR future Razorpay Webhook service.
     */
    @Transactional
    public void grantCredits(UUID userId, int creditsToGrant, String reason, UUID adminId, String ip, String ua) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        int current = user.getPaperCredits() != null ? user.getPaperCredits() : 0;
        user.setPaperCredits(current + creditsToGrant);
        userRepository.save(user);

        log.info("Granted {} credits to user {}. Reason: {}", creditsToGrant, userId, reason);
        auditLogService.log(adminId != null ? adminId : userId, "CREDITS_GRANTED", "Granted " + creditsToGrant + " credits to " + user.getUsername() + ". Reason: " + reason, ip, ua);
    }

    /**
     * Admin direct credit revocation.
     */
    @Transactional
    public void revokeCredits(UUID userId, int creditsToRevoke, String reason, UUID adminId, String ip, String ua) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        int current = user.getPaperCredits() != null ? user.getPaperCredits() : 0;
        user.setPaperCredits(Math.max(0, current - creditsToRevoke));
        userRepository.save(user);

        log.info("Revoked {} credits from user {}. Reason: {}", creditsToRevoke, userId, reason);
        auditLogService.log(adminId, "CREDITS_REVOKED", "Revoked " + creditsToRevoke + " credits from " + user.getUsername() + ". Reason: " + reason, ip, ua);
    }

    /**
     * Admin direct Unlimited Access VIP pass toggle.
     */
    @Transactional
    public void setUnlimitedAccess(UUID userId, boolean enabled, String reason, UUID adminId, String ip, String ua) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setHasUnlimitedAccess(enabled);
        userRepository.save(user);

        log.info("Set unlimited access = {} for user {}. Reason: {}", enabled, userId, reason);
        auditLogService.log(adminId, "UNLIMITED_ACCESS_TOGGLED", "Set unlimited access = " + enabled + " for " + user.getUsername() + ". Reason: " + reason, ip, ua);
    }

    /**
     * Admin payment claim approval.
     */
    @Transactional
    public PaymentRequestDto approvePaymentRequest(UUID requestId, UUID adminId, int confirmedCredits, BigDecimal confirmedAmount, String notes, String ip, String ua) {
        PaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentRequest", "id", requestId));

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalStateException("Payment request is already " + request.getStatus());
        }

        User reviewer = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        request.setStatus("APPROVED");
        request.setAdminNotes(notes);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(Instant.now());
        paymentRequestRepository.save(request);

        // Atomically grant credits to student
        grantCredits(request.getUser().getId(), confirmedCredits, "Payment Request Approved (" + request.getOrderReference() + ")", adminId, ip, ua);

        return mapToDto(request);
    }

    /**
     * Admin payment claim rejection.
     */
    @Transactional
    public PaymentRequestDto rejectPaymentRequest(UUID requestId, UUID adminId, String reason, String ip, String ua) {
        PaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentRequest", "id", requestId));

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalStateException("Payment request is already " + request.getStatus());
        }

        User reviewer = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        request.setStatus("REJECTED");
        request.setAdminNotes(reason);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(Instant.now());
        PaymentRequest saved = paymentRequestRepository.save(request);

        auditLogService.log(adminId, "PAYMENT_CLAIM_REJECTED", "Rejected payment claim " + request.getOrderReference() + ". Reason: " + reason, ip, ua);

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentRequestDto> getPendingAndAllPaymentRequests() {
        return paymentRequestRepository.findAllOrderedPendingFirst().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentRequestDto> getStudentPaymentRequests(UUID studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        return paymentRequestRepository.findByUserOrderByCreatedAtDesc(student).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Access check & Credit Redemption Logic
     */
    @Transactional
    public void verifyAccessOrDeductCredit(User student, Exam exam) {
        // Staff check
        boolean isStaff = student.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()) || "ROLE_EXAMINER".equals(r.getName()));
        if (isStaff || student.isHasUnlimitedAccess()) {
            log.info("Access granted to {} for paper {}: Staff / Unlimited Access Pass", student.getUsername(), exam.getId());
            return;
        }

        // Free trial check
        if (exam.isFreeTrial()) {
            log.info("Access granted to {} for paper {}: Free Trial Paper", student.getUsername(), exam.getId());
            return;
        }

        // Already unlocked check
        if (paperUnlockRepository.existsByUserAndExam(student, exam)) {
            log.info("Access granted to {} for paper {}: Paper Already Unlocked", student.getUsername(), exam.getId());
            return;
        }

        // Deduct 1 credit & unlock paper
        int credits = student.getPaperCredits() != null ? student.getPaperCredits() : 0;
        if (credits <= 0) {
            throw new IllegalArgumentException("INSUFFICIENT_CREDITS: You require 1 Paper Credit or Unlimited VIP Access to attempt this paper.");
        }

        student.setPaperCredits(credits - 1);
        userRepository.save(student);

        PaperUnlock unlock = PaperUnlock.builder()
                .user(student)
                .exam(exam)
                .build();
        paperUnlockRepository.save(unlock);

        log.info("Deducted 1 credit from {} to unlock paper {}", student.getUsername(), exam.getId());
    }

    private PaymentRequestDto mapToDto(PaymentRequest req) {
        return PaymentRequestDto.builder()
                .id(req.getId())
                .userId(req.getUser().getId())
                .studentName(req.getUser().getFirstName() + " " + req.getUser().getLastName())
                .studentEmail(req.getUser().getEmail())
                .creditsClaimed(req.getCreditsClaimed())
                .amountClaimedInr(req.getAmountClaimedInr())
                .orderReference(req.getOrderReference())
                .utrReference(req.getUtrReference())
                .status(req.getStatus())
                .adminNotes(req.getAdminNotes())
                .createdAt(req.getCreatedAt())
                .reviewedAt(req.getReviewedAt())
                .build();
    }
}
