package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.service.SnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/student/attempts")
@RequiredArgsConstructor
public class SnapshotController {

    private final SnapshotService snapshotService;

    @PostMapping("/{attemptId}/snapshot")
    @PreAuthorize("hasAnyRole('STUDENT', 'EXAMINER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadSnapshot(
            @PathVariable UUID attemptId,
            @RequestParam("image") MultipartFile image,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Map<String, Object> result = snapshotService.saveSnapshot(attemptId, image, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Snapshot stored successfully", result));
    }
}
