package com.exam.platform.config;

import com.exam.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile({"dev", "local"})
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("[DataInitializer] Refreshing BCrypt seed credentials for [dev/local] profile...");
        updatePasswordIfUserExists("student1",  "Student@123");
        updatePasswordIfUserExists("examiner1", "Examiner@123");
        updatePasswordIfUserExists("admin1",    "Admin@123");
        log.info("[DataInitializer] Seed credentials refreshed successfully.");
    }

    private void updatePasswordIfUserExists(String username, String rawPassword) {
        userRepository.findByUsername(username).ifPresentOrElse(
            user -> {
                user.setPasswordHash(passwordEncoder.encode(rawPassword));
                userRepository.save(user);
                log.info("[DataInitializer] BCrypt hash updated for: {}", username);
            },
            () -> log.warn("[DataInitializer] Seed user not found: {}", username)
        );
    }
}
