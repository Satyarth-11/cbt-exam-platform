package com.exam.platform.repository;

import com.exam.platform.entity.Notification;
import com.exam.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserOrUserIsNullOrderByCreatedAtDesc(User user);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.user = :user OR n.user IS NULL) AND n.read = false")
    long countUnreadNotificationsForUser(@Param("user") User user);
}
