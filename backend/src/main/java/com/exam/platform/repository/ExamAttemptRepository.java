package com.exam.platform.repository;

import com.exam.platform.entity.Exam;
import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {
    List<ExamAttempt> findByUserOrderByStartedAtDesc(User user);
    long countByUser(User user);
    List<ExamAttempt> findByStatus(String status);
    long countByStatus(String status);
    List<ExamAttempt> findByExam(Exam exam);
    long countByExam(Exam exam);

    @Query("SELECT AVG(a.score) FROM ExamAttempt a WHERE a.user = :user AND a.status = 'SUBMITTED'")
    Double findAverageScoreByUser(User user);
}
