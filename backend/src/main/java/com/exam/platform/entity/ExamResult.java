package com.exam.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false, unique = true)
    private ExamAttempt attempt;

    @Column(name = "total_correct", nullable = false)
    @Builder.Default
    private Integer totalCorrect = 0;

    @Column(name = "total_incorrect", nullable = false)
    @Builder.Default
    private Integer totalIncorrect = 0;

    @Column(name = "total_unattempted", nullable = false)
    @Builder.Default
    private Integer totalUnattempted = 0;

    @Column(name = "physics_score")
    private Double physicsScore;

    @Column(name = "chemistry_score")
    private Double chemistryScore;

    @Column(name = "maths_score")
    private Double mathsScore;

    private Double percentile;

    @Column(name = "feedback_summary", columnDefinition = "TEXT")
    private String feedbackSummary;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
