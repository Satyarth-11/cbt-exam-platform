package com.exam.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "candidate_answers", uniqueConstraints = {
    @UniqueConstraint(name = "uq_attempt_question", columnNames = {"attempt_id", "question_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "selected_option", length = 10)
    private String selectedOption; // A, B, C, D

    @Column(name = "numerical_answer")
    private Double numericalAnswer;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "NOT_VISITED"; // NOT_VISITED, NOT_ANSWERED, ANSWERED, MARKED_FOR_REVIEW, ANSWERED_AND_MARKED_FOR_REVIEW

    @UpdateTimestamp
    @Column(name = "last_updated_at")
    private Instant lastUpdatedAt;
}
