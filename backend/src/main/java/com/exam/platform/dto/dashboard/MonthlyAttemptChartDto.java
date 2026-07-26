package com.exam.platform.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyAttemptChartDto {
    private String month; // e.g. "Jan", "Feb", "Mar"
    private long attempts;
    private double avgPercentile;
}
