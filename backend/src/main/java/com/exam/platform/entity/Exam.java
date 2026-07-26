package com.exam.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String subject; // PHYSICS, CHEMISTRY, MATHEMATICS, FULL_LENGTH

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "total_marks", nullable = false)
    private Integer totalMarks;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "scheduled_start_time", nullable = false)
    private Instant scheduledStartTime;

    @Column(name = "scheduled_end_time", nullable = false)
    private Instant scheduledEndTime;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "SCHEDULED"; // SCHEDULED, LIVE, COMPLETED, DRAFT

    @Column(name = "max_violations")
    @Builder.Default
    private Integer maxViolations = 3;

    @Column(name = "is_free_trial", nullable = false)
    @Builder.Default
    private boolean freeTrial = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
