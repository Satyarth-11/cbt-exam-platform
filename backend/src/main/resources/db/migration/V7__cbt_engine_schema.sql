-- Phase 3 Database Schema: Questions and Candidate Answers for Exam Engine

-- Create Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL, -- PHYSICS, CHEMISTRY, MATHEMATICS
    section VARCHAR(10) NOT NULL, -- SECTION_A, SECTION_B
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL, -- MCQ, NUMERICAL
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_option VARCHAR(10), -- A, B, C, D
    correct_numerical_value DOUBLE PRECISION,
    marking_positive INT DEFAULT 4 NOT NULL,
    marking_negative INT DEFAULT 1 NOT NULL,
    sequence_number INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_questions_subject ON questions(exam_id, subject);

-- Create Candidate Answers Table (Incremental State Preservation)
CREATE TABLE candidate_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(10), -- A, B, C, D
    numerical_answer DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'NOT_VISITED' NOT NULL, -- NOT_VISITED, NOT_ANSWERED, ANSWERED, MARKED_FOR_REVIEW, ANSWERED_AND_MARKED_FOR_REVIEW
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_candidate_answers_attempt ON candidate_answers(attempt_id);
