package com.exam.platform.dto.engine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveAnswerResponse {
    private boolean autosubmitted;
    private String message;
}
