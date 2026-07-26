-- Seed Multi-Select MCQ and Passage-linked Questions for JEE Mock Test 01 (exam_id: e1111111-1111-1111-1111-111111111111)

-- 1. PHYSICS Passage Parent Question
INSERT INTO questions (id, exam_id, subject, section, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, sequence_number, passage_text)
VALUES
(
    'd0000000-0000-0000-0000-000000000010',
    'e1111111-1111-1111-1111-111111111111',
    'PHYSICS',
    'SECTION_A',
    'What is the nature of friction acting on the block before it starts moving?',
    'MCQ',
    'Limiting friction',
    'Static friction',
    'Kinetic friction',
    'Zero friction',
    'B',
    10,
    'A block of mass 5 kg is placed on a rough horizontal surface with coefficient of static friction 0.4 and kinetic friction 0.3. A gradually increasing horizontal force F is applied to the block.'
);

-- 2. PHYSICS Passage Linked Child Question
INSERT INTO questions (id, exam_id, subject, section, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, sequence_number, parent_question_id, passage_text)
VALUES
(
    'd0000000-0000-0000-0000-000000000011',
    'e1111111-1111-1111-1111-111111111111',
    'PHYSICS',
    'SECTION_A',
    'The magnitude of force required to just start the motion of the block is (take g = 10 m/s^2):',
    'MCQ',
    '15 N',
    '20 N',
    '25 N',
    '30 N',
    'B',
    11,
    'd0000000-0000-0000-0000-000000000010',
    'A block of mass 5 kg is placed on a rough horizontal surface with coefficient of static friction 0.4 and kinetic friction 0.3. A gradually increasing horizontal force F is applied to the block.'
);

-- 3. CHEMISTRY Multi-Select MCQ Question (MULTIPLE_CHOICE)
INSERT INTO questions (id, exam_id, subject, section, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, sequence_number)
VALUES
(
    'd0000000-0000-0000-0000-000000000012',
    'e1111111-1111-1111-1111-111111111111',
    'CHEMISTRY',
    'SECTION_A',
    'Which of the following compounds undergo rapid nucleophilic substitution via SN1 mechanism?',
    'MULTIPLE_CHOICE',
    't-Butyl Chloride',
    'Chlorobenzene',
    'Allyl Chloride',
    'Vinyl Chloride',
    'A,C',
    12
);
