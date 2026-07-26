package com.exam.platform.repository;

import com.exam.platform.entity.CandidateAnswer;
import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateAnswerRepository extends JpaRepository<CandidateAnswer, UUID> {
    List<CandidateAnswer> findByAttempt(ExamAttempt attempt);
    List<CandidateAnswer> findByAttemptId(UUID attemptId);
    Optional<CandidateAnswer> findByAttemptAndQuestion(ExamAttempt attempt, Question question);
    Optional<CandidateAnswer> findByAttemptIdAndQuestionId(UUID attemptId, UUID questionId);
}
