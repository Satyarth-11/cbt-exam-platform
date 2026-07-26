-- Seed Phase 2 Sample Exams, Candidate Attempts, Results, and System Notifications

-- 1. Seed Exams
INSERT INTO exams (id, title, description, subject, total_questions, total_marks, duration_minutes, scheduled_start_time, scheduled_end_time, status)
VALUES
(
    'e1111111-1111-1111-1111-111111111111',
    'JEE Main All India Open Mock Test 01',
    'Full syllabus simulation mock test covering Physics, Chemistry, and Mathematics strictly per latest NTA JEE Main pattern.',
    'FULL_LENGTH',
    75,
    300,
    180,
    CURRENT_TIMESTAMP + INTERVAL '2 HOURS',
    CURRENT_TIMESTAMP + INTERVAL '5 HOURS',
    'SCHEDULED'
),
(
    'e2222222-2222-2222-2222-222222222222',
    'Physics Chapterwise Speed Test: Mechanics & Electrodynamics',
    'Targeted problem set focusing on Laws of Motion, Work Energy Power, Electrostatics, and Magnetism.',
    'PHYSICS',
    30,
    120,
    60,
    CURRENT_TIMESTAMP + INTERVAL '1 DAY',
    CURRENT_TIMESTAMP + INTERVAL '1 DAY 2 HOURS',
    'SCHEDULED'
),
(
    'e3333333-3333-3333-3333-333333333333',
    'Chemistry Full Mock: Organic & Physical Practice',
    'Comprehensive practice test for Reaction Mechanisms, Thermodynamics, and Chemical Kinetics.',
    'CHEMISTRY',
    30,
    120,
    60,
    CURRENT_TIMESTAMP + INTERVAL '2 DAYS',
    CURRENT_TIMESTAMP + INTERVAL '2 DAYS 2 HOURS',
    'SCHEDULED'
),
(
    'e4444444-4444-4444-4444-444444444444',
    'JEE Advanced Mathematics Diagnostic Paper',
    'High difficulty level paper designed to test conceptual clarity in Calculus, Algebra, and Coordinate Geometry.',
    'MATHEMATICS',
    30,
    120,
    90,
    CURRENT_TIMESTAMP - INTERVAL '3 DAYS',
    CURRENT_TIMESTAMP - INTERVAL '3 DAYS 2 HOURS',
    'COMPLETED'
);

-- 2. Seed Past Attempts for Student (Rahul Sharma: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
INSERT INTO attempts (id, exam_id, user_id, status, started_at, submitted_at, score, percentage, rank_position)
VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'e4444444-4444-4444-4444-444444444444',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'SUBMITTED',
    CURRENT_TIMESTAMP - INTERVAL '3 DAYS',
    CURRENT_TIMESTAMP - INTERVAL '3 DAYS 1 HOUR 25 MINS',
    236.0,
    78.67,
    14
);

-- 3. Seed Attempt Results (UUID must be valid hex, using 'd' prefix instead of 'r')
INSERT INTO results (id, attempt_id, total_correct, total_incorrect, total_unattempted, physics_score, chemistry_score, maths_score, percentile, feedback_summary)
VALUES
(
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    62,
    8,
    5,
    84.0,
    76.0,
    76.0,
    98.42,
    'Outstanding accuracy in Physics Mechanics. Focus on speed in Integral Calculus.'
);

-- 4. Seed Candidate Notifications (UUID must be valid hex, using 'f' prefix instead of 'n')
INSERT INTO notifications (id, user_id, title, message, type, is_read)
VALUES
(
    'f1111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'All India Mock Test 01 Scheduled',
    'JEE Main All India Open Mock Test 01 is scheduled to start today. Ensure your system meets proctoring readiness.',
    'EXAM_ALERT',
    FALSE
),
(
    'f2222222-2222-2222-2222-222222222222',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Scorecard Released: Diagnostic Test',
    'Your scorecard for JEE Advanced Mathematics Diagnostic Paper has been calculated. Percentile achieved: 98.42%.',
    'RESULT_DECLARED',
    TRUE
),
(
    'f3333333-3333-3333-3333-333333333333',
    NULL,
    'System Maintenance Completed',
    'Single-Active-Session security enforcement and MailHog dev email integration are fully operational.',
    'SYSTEM_ANNOUNCEMENT',
    FALSE
);
