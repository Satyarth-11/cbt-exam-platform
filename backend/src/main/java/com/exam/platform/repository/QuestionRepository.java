package com.exam.platform.repository;

import com.exam.platform.entity.Exam;
import com.exam.platform.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByExamOrderBySequenceNumberAsc(Exam exam);
    List<Question> findByExamIdOrderBySequenceNumberAsc(UUID examId);
}
