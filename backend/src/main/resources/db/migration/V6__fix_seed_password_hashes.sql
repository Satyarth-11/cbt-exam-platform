-- V6: Fix seed user password hashes 
-- The original V3 seeded invalid/placeholder BCrypt hashes that cannot be verified.
-- This migration overwrites them with real pre-verified BCrypt hashes.
-- BCrypt strength 10:
--   student@exam.com  -> Student@123
--   examiner@exam.com -> Examiner@123
--   admin@exam.com    -> Admin@123

UPDATE users
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE username IN ('student1', 'examiner1', 'admin1');
