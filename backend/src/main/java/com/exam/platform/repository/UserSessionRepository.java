package com.exam.platform.repository;

import com.exam.platform.entity.User;
import com.exam.platform.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
    Optional<UserSession> findByIdAndActiveTrue(UUID id);
    List<UserSession> findByUserAndActiveTrue(User user);

    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.active = false WHERE s.user = :user AND s.active = true")
    void invalidateAllActiveSessionsForUser(User user);
}
