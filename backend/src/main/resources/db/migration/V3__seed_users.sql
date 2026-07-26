-- Seed System Users
-- Default Passwords:
-- Student:  Student@123
-- Examiner: Examiner@123
-- Admin:    Admin@123

-- 1. Student User
INSERT INTO users (id, username, email, password_hash, first_name, last_name, is_active, is_email_verified)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'student1',
    'student@exam.com',
    '$2a$10$Z1J6D8a0x.K7Jz3vF8t1u.5G8K6Z7Y8u2K4pL6vC.gZ7u7D7Gz0F',
    'Rahul',
    'Sharma',
    TRUE,
    TRUE
);

-- 2. Examiner User
INSERT INTO users (id, username, email, password_hash, first_name, last_name, is_active, is_email_verified)
VALUES (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'examiner1',
    'examiner@exam.com',
    '$2a$10$Z1J6D8a0x.K7Jz3vF8t1u.5G8K6Z7Y8u2K4pL6vC.gZ7u7D7Gz0F',
    'Dr. Vikram',
    'Seth',
    TRUE,
    TRUE
);

-- 3. Admin User
INSERT INTO users (id, username, email, password_hash, first_name, last_name, is_active, is_email_verified)
VALUES (
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'admin1',
    'admin@exam.com',
    '$2a$10$Z1J6D8a0x.K7Jz3vF8t1u.5G8K6Z7Y8u2K4pL6vC.gZ7u7D7Gz0F',
    'System',
    'Administrator',
    TRUE,
    TRUE
);

-- Map Seed Users to Roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'student1' AND r.name = 'ROLE_STUDENT';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'examiner1' AND r.name = 'ROLE_EXAMINER';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin1' AND r.name = 'ROLE_ADMIN';
