package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.PreviousYearPaperService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/pyp")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT', 'EXAMINER', 'ADMIN')")
public class PreviousYearPaperController {

    private final PreviousYearPaperService previousYearPaperService;

    @GetMapping("/papers")
    public ResponseEntity<ApiResponse<List<PreviousYearPaperService.PypPaperDto>>> getPypCatalog(
            @RequestParam(value = "examType", required = false) String examType,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "subject", required = false) String subject
    ) {
        List<PreviousYearPaperService.PypPaperDto> catalog = previousYearPaperService.getPypCatalog(examType, year, subject);
        return ResponseEntity.ok(ApiResponse.success("Previous year paper catalog fetched", catalog));
    }

    @GetMapping("/papers/{paperId}")
    public ResponseEntity<ApiResponse<PreviousYearPaperService.PypDetailDto>> getPypDetail(
            @PathVariable UUID paperId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(name = "includeSolutions", defaultValue = "false") boolean includeSolutions
    ) {
        UUID userId = userDetails != null ? userDetails.getId() : null;
        PreviousYearPaperService.PypDetailDto detail = previousYearPaperService.getPypDetail(paperId, userId, includeSolutions);
        return ResponseEntity.ok(ApiResponse.success("Previous year paper detail fetched", detail));
    }

    @PostMapping("/papers/{paperId}/attempt")
    public ResponseEntity<ApiResponse<Map<String, Object>>> attemptPypAsMockTest(
            @PathVariable UUID paperId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");

        ExamAttempt attempt = previousYearPaperService.attemptPypAsMockTest(paperId, userDetails.getId(), ipAddress, userAgent);

        return ResponseEntity.ok(ApiResponse.success(
                "PYP Mock Test session initialized successfully",
                Map.of("attemptId", attempt.getId(), "examId", paperId)
        ));
    }

    @GetMapping("/papers/{paperId}/pdf")
    public ResponseEntity<byte[]> downloadPypPdf(@PathVariable UUID paperId) throws Exception {
        byte[] pdfBytes = previousYearPaperService.generatePypPdf(paperId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"pyp_question_paper_" + paperId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
