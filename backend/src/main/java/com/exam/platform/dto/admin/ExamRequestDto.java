package com.exam.platform.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Subject is required")
    private String subject; // PHYSICS, CHEMISTRY, MATHEMATICS, FULL_LENGTH

    @NotNull(message = "Total questions is required")
    @Min(value = 1, message = "Total questions must be at least 1")
    private Integer totalQuestions;

    @NotNull(message = "Total marks is required")
    @Min(value = 1, message = "Total marks must be at least 1")
    private Integer totalMarks;

    @NotNull(message = "Duration in minutes is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    @NotNull(message = "Scheduled start time is required")
    private Instant scheduledStartTime;

    @NotNull(message = "Scheduled end time is required")
    private Instant scheduledEndTime;

    @Builder.Default
    private String status = "SCHEDULED"; // SCHEDULED, LIVE, COMPLETED, DRAFT

    @Builder.Default
    private Integer maxViolations = 3;
}
