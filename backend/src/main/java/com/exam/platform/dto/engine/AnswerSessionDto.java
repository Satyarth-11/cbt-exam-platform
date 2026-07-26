package com.exam.platform.dto.engine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerSessionDto {
    private UUID questionId;
    private String selectedOption;
    private Double numericalAnswer;
    private String status; // NOT_VISITED, NOT_ANSWERED, ANSWERED, etc.
}
