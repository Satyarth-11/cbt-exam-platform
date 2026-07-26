package com.exam.platform.security;

import com.exam.platform.entity.User;
import com.exam.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = null;

        // Try lookup by UUID first
        try {
            UUID id = UUID.fromString(identifier);
            user = userRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException ignored) {
            // Not a valid UUID, fallback to username/email
        }

        if (user == null) {
            user = userRepository.findByUsername(identifier)
                    .or(() -> userRepository.findByEmail(identifier))
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + identifier));
        }

        return CustomUserDetails.build(user);
    }
}
