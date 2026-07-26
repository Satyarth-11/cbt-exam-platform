package com.exam.platform.repository;

import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.entity.ExamSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamSnapshotRepository extends JpaRepository<ExamSnapshot, UUID> {
    List<ExamSnapshot> findByAttemptOrderByCapturedAtDesc(ExamAttempt attempt);
    List<ExamSnapshot> findByAttemptIdOrderByCapturedAtDesc(UUID attemptId);
}
