package com.exam.platform.repository;

import com.exam.platform.entity.ProctorViolation;
import com.exam.platform.entity.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProctorViolationRepository extends JpaRepository<ProctorViolation, UUID> {
    List<ProctorViolation> findByAttemptOrderByCreatedAtDesc(ExamAttempt attempt);
    List<ProctorViolation> findByAttemptIdOrderByCreatedAtDesc(UUID attemptId);
    long countByAttempt(ExamAttempt attempt);
    long countByAttemptId(UUID attemptId);
}
