package com.exam.platform.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRequestDto {

    @NotBlank(message = "Subject is required")
    private String subject; // PHYSICS, CHEMISTRY, MATHEMATICS

    @NotBlank(message = "Section is required")
    private String section; // SECTION_A, SECTION_B

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotBlank(message = "Question type is required")
    private String questionType; // MCQ, MULTIPLE_CHOICE, NUMERICAL

    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctOption; // A, B, C, D

    private Double correctNumericalValue;

    @Builder.Default
    private Integer markingPositive = 4;

    @Builder.Default
    private Integer markingNegative = 1;

    @NotNull(message = "Sequence number is required")
    private Integer sequenceNumber;

    private UUID parentQuestionId;
    private String passageText;
    private String explanation;
}
