package com.exam.platform.dto.engine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSessionDto {
    private UUID attemptId;
    private UUID examId;
    private String examTitle;
    private long remainingSeconds;
    private List<QuestionSessionDto> questions;
    private List<AnswerSessionDto> answers;
}
