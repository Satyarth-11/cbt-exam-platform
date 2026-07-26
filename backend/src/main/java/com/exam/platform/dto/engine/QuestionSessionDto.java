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
public class QuestionSessionDto {
    private UUID id;
    private String subject; // PHYSICS, CHEMISTRY, MATHEMATICS
    private String section; // SECTION_A, SECTION_B
    private String questionText;
    private String questionType; // MCQ, NUMERICAL
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private Integer markingPositive;
    private Integer markingNegative;
    private Integer sequenceNumber;
    private UUID parentQuestionId;
    private String passageText;
    // NOTE: correctOption and correctNumericalValue are strictly REDACTED here to prevent candidate inspection.
}
