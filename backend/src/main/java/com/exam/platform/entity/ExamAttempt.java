package com.exam.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "IN_PROGRESS"; // NOT_STARTED, IN_PROGRESS, SUBMITTED, AUTO_SUBMITTED, TIMED_OUT

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    private Double score;

    private Double percentage;

    @Column(name = "rank_position")
    private Integer rankPosition;

    @Column(name = "shuffle_seed")
    private Long shuffleSeed;

    @Column(name = "paused_at")
    private Instant pausedAt;

    @Column(name = "paused_duration_seconds")
    @Builder.Default
    private Long pausedDurationSeconds = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
