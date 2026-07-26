package com.exam.platform.repository;

import com.exam.platform.entity.PaymentRequest;
import com.exam.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, UUID> {
    List<PaymentRequest> findByUserOrderByCreatedAtDesc(User user);
    Optional<PaymentRequest> findByOrderReference(String orderReference);

    @Query("SELECT p FROM PaymentRequest p ORDER BY CASE WHEN p.status = 'PENDING' THEN 0 ELSE 1 END, p.createdAt DESC")
    List<PaymentRequest> findAllOrderedPendingFirst();
}
