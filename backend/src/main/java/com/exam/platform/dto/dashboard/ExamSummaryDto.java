package com.exam.platform.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSummaryDto {

    private UUID id;
    private String title;
    private String description;
    private String subject;
    private Integer totalQuestions;
    private Integer totalMarks;
    private Integer durationMinutes;
    private Instant scheduledStartTime;
    private Instant scheduledEndTime;
    private String status;
}
