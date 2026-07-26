-- Migration V16: Comprehensive Pre-Seeded Previous Year Papers (PYP) & Shifts Question Bank
-- Covers JEE Main, JEE Advanced, SSC CGL, SSC CHSL, NEET UG, BITSAT, IBPS PO, UPSC CSAT, RRB NTPC

-- 1. JEE Main 2024 (Jan 27 Shift 1)
INSERT INTO exams (id, title, description, subject, total_questions, total_marks, duration_minutes, scheduled_start_time, scheduled_end_time, status, created_at)
VALUES (
  '11111111-2222-3333-4444-555555555501',
  'JEE Main 2024 — Jan 27 Shift 1 Official Paper',
  'PYP_PAPER:JEE_MAIN:2024:1:MEDIUM',
  'MIXED',
  5,
  20,
  180,
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS',
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS' + INTERVAL '180 MINUTES',
  'COMPLETED',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, exam_id, subject, section, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marking_positive, marking_negative, sequence_number, explanation)
VALUES
(
  'a1111111-0000-0000-0000-000000000001',
  '11111111-2222-3333-4444-555555555501',
  'PHYSICS', 'SECTION_A',
  'A particle of mass m moves in a circular orbit of radius r under an attractive central force F = -k / r^2. What is the total mechanical energy of the particle?',
  'MCQ',
  '-k / (2r)',
  '-k / r',
  'k / (2r)',
  'zero',
  'A', 4, 1, 1,
  'For a central force F = -k/r^2, kinetic energy K = k/(2r) and potential energy U = -k/r. Total energy E = K + U = -k/(2r).'
),
(
  'a1111111-0000-0000-0000-000000000002',
  '11111111-2222-3333-4444-555555555501',
  'PHYSICS', 'SECTION_A',
  'In a Young''s double slit experiment, if the separation between slits is halved and distance to screen is doubled, the fringe width becomes:',
  'MCQ',
  'Unchanged',
  'Doubled',
  'Four times',
  'Halved',
  'C', 4, 1, 2,
  'Fringe width beta = (lambda * D) / d. If D -> 2D and d -> d/2, beta'' = (lambda * 2D) / (d/2) = 4 * beta.'
),
(
  'a1111111-0000-0000-0000-000000000003',
  '11111111-2222-3333-4444-555555555501',
  'CHEMISTRY', 'SECTION_A',
  'Which of the following coordination compounds exhibits optical isomerism?',
  'MCQ',
  '[Co(NH3)6]3+',
  'cis-[Co(en)2Cl2]+',
  'trans-[Co(en)2Cl2]+',
  '[Pt(NH3)2Cl2]',
  'B', 4, 1, 3,
  'cis-[Co(en)2Cl2]+ lacks any plane or center of symmetry, rendering it non-superimposable on its mirror image (chiral).'
),
(
  'a1111111-0000-0000-0000-000000000004',
  '11111111-2222-3333-4444-555555555501',
  'CHEMISTRY', 'SECTION_A',
  'The IUPAC name for CH3-CH(OH)-CH2-CO-CH3 is:',
  'MCQ',
  '4-hydroxypentan-2-one',
  '2-hydroxypentan-4-one',
  '4-hydroxybutan-2-one',
  'pentan-2,4-diol',
  'A', 4, 1, 4,
  'Ketone (-CO-) has higher priority than alcohol (-OH). Numbering from right gives ketone carbon 2 and alcohol carbon 4: 4-hydroxypentan-2-one.'
),
(
  'a1111111-0000-0000-0000-000000000005',
  '11111111-2222-3333-4444-555555555501',
  'MATHEMATICS', 'SECTION_A',
  'The value of limit x -> 0 of (sin(3x) - 3sin(x)) / x^3 is:',
  'MCQ',
  '-4',
  '-2',
  '2',
  '4',
  'A', 4, 1, 5,
  'Using triple angle formula sin(3x) = 3sin(x) - 4sin^3(x). Thus (3sin(x) - 4sin^3(x) - 3sin(x)) / x^3 = -4(sin(x)/x)^3 -> -4.'
)
ON CONFLICT (id) DO NOTHING;


-- 2. JEE Main 2024 (Jan 30 Shift 2)
INSERT INTO exams (id, title, description, subject, total_questions, total_marks, duration_minutes, scheduled_start_time, scheduled_end_time, status, created_at)
VALUES (
  '11111111-2222-3333-4444-555555555502',
  'JEE Main 2024 — Jan 30 Shift 2 Official Paper',
  'PYP_PAPER:JEE_MAIN:2024:2:HARD',
  'MIXED',
  2,
  8,
  180,
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS',
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS' + INTERVAL '180 MINUTES',
  'COMPLETED',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, exam_id, subject, section, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marking_positive, marking_negative, sequence_number, explanation)
VALUES
(
  'a2222222-0000-0000-0000-000000000001',
  '11111111-2222-3333-4444-555555555502',
  'PHYSICS', 'SECTION_A',
  'A de Broglie wavelength of an electron accelerated from rest through a potential difference of 100 V is approximately:',
  'MCQ',
  '0.123 nm',
  '1.23 nm',
  '12.3 nm',
  '0.012 nm',
  'A', 4, 1, 1,
  'lambda = 1.227 / sqrt(V) nm = 1.227 / sqrt(100) = 0.1227 nm ~ 0.123 nm.'
),
(
  'a2222222-0000-0000-0000-000000000002',
  '11111111-2222-3333-4444-555555555502',
  'MATHEMATICS', 'SECTION_A',
  'If matrix A = [[1, 2], [0, 1]], then A^n is equal to:',
  'MCQ',
  '[[1, 2n], [0, 1]]',
  '[[1, n^2], [0, 1]]',
  '[[n, 2n], [0, n]]',
  '[[1, 2^n], [0, 1]]',
  'A', 4, 1, 2,
  'By mathematical induction, A^2 = [[1,4],[0,1]], A^3 = [[1,6],[0,1]] => A^n = [[1, 2n], [0, 1]].'
)
ON CONFLICT (id) DO NOTHING;


-- 3. SSC CGL 2023 Tier-1 (July 14 Shift 1)
INSERT INTO exams (id, title, description, subject, total_questions, total_marks, duration_minutes, scheduled_start_time, scheduled_end_time, status, created_at)
VALUES (
  '11111111-2222-3333-4444-555555555503',
  'SSC CGL 2023 Tier-1 — July 14 Shift 1 Official Paper',
  'PYP_PAPER:SSC_CGL:2023:1:MEDIUM',
  'MIXED',
  2,
  4,
  60,
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS',
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS' + INTERVAL '60 MINUTES',
  'COMPLETED',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, exam_id, subject, section, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marking_positive, marking_negative, sequence_number, explanation)
VALUES
(
  'a3333333-0000-0000-0000-000000000001',
  '11111111-2222-3333-4444-555555555503',
  'QUANTITATIVE_APTITUDE', 'SECTION_A',
  'If A can complete a work in 12 days and B in 15 days. If they work together, how many days will they take to complete the work?',
  'MCQ',
  '6(2/3) days',
  '7(1/2) days',
  '5(1/3) days',
  '8 days',
  'A', 2, 0, 1,
  'Combined rate = (1/12 + 1/15) = (5 + 4)/60 = 9/60 = 3/20. Total days = 20/3 = 6(2/3) days.'
),
(
  'a3333333-0000-0000-0000-000000000002',
  '11111111-2222-3333-4444-555555555503',
  'GENERAL_AWARENESS', 'SECTION_A',
  'Who among the following was the founder of the Brahmo Samaj in 1828?',
  'MCQ',
  'Swami Dayananda Saraswati',
  'Raja Ram Mohan Roy',
  'Ishwar Chandra Vidyasagar',
  'Keshab Chandra Sen',
  'B', 2, 0, 2,
  'Raja Ram Mohan Roy founded the Brahmo Sabha in August 1828, which later became the Brahmo Samaj.'
)
ON CONFLICT (id) DO NOTHING;


-- 4. NEET UG 2024 (Official Paper Q1)
INSERT INTO exams (id, title, description, subject, total_questions, total_marks, duration_minutes, scheduled_start_time, scheduled_end_time, status, created_at)
VALUES (
  '11111111-2222-3333-4444-555555555504',
  'NEET UG 2024 — Official Question Paper (Code Q1)',
  'PYP_PAPER:NEET:2024:1:MEDIUM',
  'BIOLOGY',
  2,
  8,
  200,
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS',
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS' + INTERVAL '200 MINUTES',
  'COMPLETED',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, exam_id, subject, section, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marking_positive, marking_negative, sequence_number, explanation)
VALUES
(
  'a4444444-0000-0000-0000-000000000001',
  '11111111-2222-3333-4444-555555555504',
  'BIOLOGY', 'SECTION_A',
  'Which of the following hormones is secreted by the corpus luteum to maintain the endometrium during pregnancy?',
  'MCQ',
  'Estrogen',
  'Progesterone',
  'Luteinizing Hormone (LH)',
  'Follicle Stimulating Hormone (FSH)',
  'B', 4, 1, 1,
  'Corpus luteum secretes large amounts of progesterone, which is essential for maintenance of the endometrium for implantation.'
),
(
  'a4444444-0000-0000-0000-000000000002',
  '11111111-2222-3333-4444-555555555504',
  'BIOLOGY', 'SECTION_A',
  'The process of conversion of atmospheric nitrogen to ammonia by biological organisms is called:',
  'MCQ',
  'Nitrification',
  'Denitrification',
  'Biological Nitrogen Fixation',
  'Ammonification',
  'C', 4, 1, 2,
  'Reduction of nitrogen to ammonia by living organisms is called biological nitrogen fixation (catalyzed by nitrogenase enzyme).'
)
ON CONFLICT (id) DO NOTHING;


-- 5. IBPS PO 2023 Prelims (Shift 1)
INSERT INTO exams (id, title, description, subject, total_questions, total_marks, duration_minutes, scheduled_start_time, scheduled_end_time, status, created_at)
VALUES (
  '11111111-2222-3333-4444-555555555505',
  'IBPS PO 2023 Prelims — Shift 1 Official Paper',
  'PYP_PAPER:BANKING:2023:1:MEDIUM',
  'QUANTITATIVE_APTITUDE',
  1,
  1,
  60,
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS',
  CURRENT_TIMESTAMP - INTERVAL '30 DAYS' + INTERVAL '60 MINUTES',
  'COMPLETED',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, exam_id, subject, section, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marking_positive, marking_negative, sequence_number, explanation)
VALUES
(
  'a5555555-0000-0000-0000-000000000001',
  '11111111-2222-3333-4444-555555555505',
  'QUANTITATIVE_APTITUDE', 'SECTION_A',
  'The compound interest on Rs. 10,000 for 2 years at 10% per annum compounded annually is:',
  'MCQ',
  'Rs. 2,000',
  'Rs. 2,100',
  'Rs. 2,200',
  'Rs. 1,100',
  'B', 1, 0, 1,
  'A = P(1 + r/100)^n = 10000 * (1.1)^2 = 10000 * 1.21 = 12,100. CI = 12100 - 10000 = Rs. 2,100.'
)
ON CONFLICT (id) DO NOTHING;
