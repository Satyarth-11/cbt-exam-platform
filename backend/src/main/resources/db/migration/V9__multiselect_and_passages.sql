-- V9: Support Multi-Select MCQs, Comprehension Passage Groups, and Attempt Option Shuffling

-- 1. Add shuffle_seed to attempts table
ALTER TABLE attempts ADD COLUMN shuffle_seed BIGINT;

-- 2. Add passage/comprehension group support to questions table
ALTER TABLE questions ADD COLUMN parent_question_id UUID REFERENCES questions(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN passage_text TEXT;

-- 3. Increase length of option selection columns to store comma-separated lists for multi-select
ALTER TABLE questions ALTER COLUMN correct_option TYPE VARCHAR(50);
ALTER TABLE candidate_answers ALTER COLUMN selected_option TYPE VARCHAR(50);
