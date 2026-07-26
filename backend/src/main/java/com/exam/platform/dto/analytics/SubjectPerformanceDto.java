package com.exam.platform.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectPerformanceDto {
    private String subject; // PHYSICS, CHEMISTRY, MATHEMATICS
    private int totalQuestions;
    private int correctCount;
    private int incorrectCount;
    private int unattemptedCount;
    private double marksObtained;
    private double maxMarks;
    private double accuracyPercentage;
}
