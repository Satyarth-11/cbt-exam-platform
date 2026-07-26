package com.exam.platform.repository;

import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, UUID> {
    Optional<ExamResult> findByAttempt(ExamAttempt attempt);
}
