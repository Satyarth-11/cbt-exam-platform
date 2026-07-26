package com.exam.platform.controller;

import com.exam.platform.dto.ApiResponse;
import com.exam.platform.entity.AuditLog;
import com.exam.platform.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EXAMINER')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "userId", required = false) UUID userId,
            @RequestParam(value = "query", required = false) String query
    ) {
        List<AuditLog> logs;
        if (action != null && !action.isBlank()) {
            logs = auditLogRepository.findByActionOrderByCreatedAtDesc(action);
        } else if (userId != null) {
            logs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else {
            logs = auditLogRepository.findTop100ByOrderByCreatedAtDesc();
        }

        if (query != null && !query.isBlank()) {
            String lowerQuery = query.toLowerCase();
            logs = logs.stream().filter(l ->
                    (l.getDetails() != null && l.getDetails().toLowerCase().contains(lowerQuery)) ||
                    (l.getIpAddress() != null && l.getIpAddress().contains(lowerQuery)) ||
                    (l.getUserId() != null && l.getUserId().toString().toLowerCase().contains(lowerQuery))
            ).collect(Collectors.toList());
        }

        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/actions")
    public ResponseEntity<ApiResponse<List<String>>> getDistinctActions() {
        List<String> actions = auditLogRepository.findDistinctActions();
        return ResponseEntity.ok(ApiResponse.success(actions));
    }
}
