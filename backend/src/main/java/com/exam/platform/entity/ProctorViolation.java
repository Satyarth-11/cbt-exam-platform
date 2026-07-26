package com.exam.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "proctor_violations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProctorViolation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @Column(name = "violation_type", nullable = false, length = 50)
    private String violationType; // TAB_SWITCH, FULLSCREEN_EXIT, FACE_MISSING, MULTIPLE_FACES, DEVTOOLS_OPEN, PRINT_ATTEMPT, COPY_PASTE

    @Column(length = 10)
    @Builder.Default
    private String severity = "MEDIUM"; // HIGH, MEDIUM, LOW

    @Column(length = 255)
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
