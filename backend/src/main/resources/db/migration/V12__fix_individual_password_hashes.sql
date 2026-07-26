-- V12: No-op placeholder
-- Password hash fixing for seed users is handled dynamically by DataInitializer.java
-- which runs under the 'dev' Spring profile at application boot time and sets verified BCrypt hashes.
-- This file was intentionally preserved as a no-op migration to maintain Flyway migration sequence continuity.

SELECT 1;
