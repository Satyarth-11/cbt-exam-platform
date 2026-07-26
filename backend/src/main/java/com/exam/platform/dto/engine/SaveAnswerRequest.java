package com.exam.platform.dto.engine;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveAnswerRequest {

    @NotNull(message = "Question ID is required")
    private UUID questionId;

    private String selectedOption; // A, B, C, D (null if numerical or cleared)

    private Double numericalAnswer; // (null if MCQ or cleared)

    @NotBlank(message = "Status is required")
    private String status; // NOT_VISITED, NOT_ANSWERED, ANSWERED, MARKED_FOR_REVIEW, ANSWERED_AND_MARKED_FOR_REVIEW
}
