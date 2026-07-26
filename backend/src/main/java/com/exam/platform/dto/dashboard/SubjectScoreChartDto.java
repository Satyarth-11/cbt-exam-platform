package com.exam.platform.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectScoreChartDto {
    private String subject; // "Physics", "Chemistry", "Mathematics"
    private double avgAccuracy;
    private long totalExams;
}
