package com.exam.platform.repository;

import com.exam.platform.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT a.action FROM AuditLog a ORDER BY a.action ASC")
    List<String> findDistinctActions();
}
