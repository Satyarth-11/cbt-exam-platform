-- V14: Add Solution Explanations to Questions
ALTER TABLE questions ADD COLUMN explanation TEXT;

-- Seed sample solution explanations for seeded mock questions
UPDATE questions 
SET explanation = 'Using kinematics equation v = u + at or energy conservation principles. Calculate net force F = ma to determine acceleration, then substitute velocity values.'
WHERE subject = 'PHYSICS' AND (question_type = 'MCQ' OR question_type = 'MULTIPLE_CHOICE');

UPDATE questions 
SET explanation = 'Apply stoichiometry principles and the ideal gas law PV = nRT. Calculate molar mass to convert grams to moles.'
WHERE subject = 'CHEMISTRY' AND (question_type = 'MCQ' OR question_type = 'MULTIPLE_CHOICE');

UPDATE questions 
SET explanation = 'Use calculus differentiation/integration properties or matrix determinant expansion formulas to find roots.'
WHERE subject = 'MATHEMATICS' AND (question_type = 'MCQ' OR question_type = 'MULTIPLE_CHOICE');

UPDATE questions 
SET explanation = 'Numerical calculation: evaluate expression to 3 decimal places using exact decimal formulas.'
WHERE question_type = 'NUMERICAL';
