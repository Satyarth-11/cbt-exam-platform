package com.exam.platform.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionReviewDto {
    private UUID questionId;
    private int sequenceNumber;
    private String subject;
    private String section;
    private String questionType; // MCQ, MULTIPLE_CHOICE, NUMERICAL
    private String questionText;
    private String passageText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String selectedOption;
    private String correctOption;
    private Double selectedNumericalValue;
    private Double correctNumericalValue;
    private String status; // CORRECT, INCORRECT, UNATTEMPTED
    private double marksAwarded;
    private String explanation;
}
