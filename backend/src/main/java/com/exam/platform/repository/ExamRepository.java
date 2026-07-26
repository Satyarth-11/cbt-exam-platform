package com.exam.platform.repository;

import com.exam.platform.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {
    List<Exam> findTop10ByStatusInOrderByScheduledStartTimeAsc(List<String> statuses);
    List<Exam> findByStatus(String status);
    long countByStatus(String status);

    @Query("SELECT e.subject, COUNT(e) FROM Exam e GROUP BY e.subject")
    List<Object[]> countExamsBySubject();
}
