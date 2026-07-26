package com.exam.platform.repository;

import com.exam.platform.entity.Exam;
import com.exam.platform.entity.PaperUnlock;
import com.exam.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaperUnlockRepository extends JpaRepository<PaperUnlock, UUID> {
    Optional<PaperUnlock> findByUserAndExam(User user, Exam exam);
    boolean existsByUserAndExam(User user, Exam exam);
    List<PaperUnlock> findByUser(User user);
}
