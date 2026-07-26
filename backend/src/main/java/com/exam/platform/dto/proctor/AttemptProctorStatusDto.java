package com.exam.platform.dto.proctor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptProctorStatusDto {
    private UUID attemptId;
    private UUID userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String examTitle;
    private Instant startedAt;
    private String status; // IN_PROGRESS, SUBMITTED, AUTO_SUBMITTED
    private long remainingSeconds;
    private long totalViolationsCount;
    private List<ViolationDetailDto> violations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViolationDetailDto {
        private UUID id;
        private String violationType;
        private String severity;
        private String details;
        private Instant createdAt;
    }
}
