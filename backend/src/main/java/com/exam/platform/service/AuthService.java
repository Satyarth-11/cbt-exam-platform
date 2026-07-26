package com.exam.platform.service;

import com.exam.platform.dto.auth.*;
import com.exam.platform.entity.*;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.*;
import com.exam.platform.security.CustomUserDetails;
import com.exam.platform.security.JwtProvider;
import com.exam.platform.security.TokenHashUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    @Transactional
    public TokenResponse login(LoginRequest request, String ipAddress, String userAgent) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword())
        );

        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        // Single-Active-Session Enforcement: Invalidate all existing active sessions for this user
        userSessionRepository.invalidateAllActiveSessionsForUser(user);

        // Create new active session
        UserSession newSession = UserSession.builder()
                .user(user)
                .refreshTokenHash("") // updated after token creation
                .deviceInfo(userAgent != null ? userAgent : "Unknown Device")
                .ipAddress(ipAddress)
                .active(true)
                .expiresAt(Instant.now().plusMillis(604800000)) // 7 days
                .lastActiveAt(Instant.now())
                .build();
        UserSession savedSession = userSessionRepository.save(newSession);

        String accessToken = jwtProvider.generateAccessToken(authentication, savedSession.getId());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId(), savedSession.getId());

        savedSession.setRefreshTokenHash(passwordEncoder.encode(refreshToken));
        userSessionRepository.save(savedSession);

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        auditLogService.log(user.getId(), "LOGIN_SUCCESS", "User logged in. Single session created: " + savedSession.getId(), ipAddress, userAgent);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(roles)
                .sessionId(savedSession.getId())
                .build();
    }

    @Transactional
    public TokenResponse refreshToken(RefreshTokenRequest request, String ipAddress, String userAgent) {
        String refreshToken = request.getRefreshToken();

        if (!jwtProvider.validateJwtToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String userIdStr = jwtProvider.getUserIdFromJwt(refreshToken);
        String sessionIdStr = jwtProvider.getSessionIdFromJwt(refreshToken);

        UUID userId = UUID.fromString(userIdStr);
        UUID sessionId = UUID.fromString(sessionIdStr);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserSession session = userSessionRepository.findByIdAndActiveTrue(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session invalidated or expired. Logged in from another device."));

        // Generate new Access Token keeping existing session ID
        CustomUserDetails userDetails = CustomUserDetails.build(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        String newAccessToken = jwtProvider.generateAccessToken(authentication, session.getId());

        session.setLastActiveAt(Instant.now());
        userSessionRepository.save(session);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(roles)
                .sessionId(session.getId())
                .build();
    }

    @Transactional
    public void logout(UUID sessionId, UUID userId, String ipAddress, String userAgent) {
        if (sessionId != null) {
            userSessionRepository.findById(sessionId).ifPresent(session -> {
                session.setActive(false);
                userSessionRepository.save(session);
            });
        }
        auditLogService.log(userId, "LOGOUT", "User logged out", ipAddress, userAgent);
    }

    /**
     * Public Self-Registration: Strictly forced to ROLE_STUDENT.
     * Prevents privilege escalation.
     */
    @Transactional
    public UserProfileResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered!");
        }

        // Strictly enforce ROLE_STUDENT for public self-registration
        Role studentRole = roleRepository.findByName("ROLE_STUDENT")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "ROLE_STUDENT"));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .active(true)
                .emailVerified(false)
                .build();

        user.getRoles().add(studentRole);
        User savedUser = userRepository.save(user);

        // Generate email verification token with deterministic SHA-256 hex hashing
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = TokenHashUtils.hashToken(rawToken);

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(savedUser)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plusSeconds(86400)) // 24 hrs
                .used(false)
                .build();
        emailVerificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(savedUser.getEmail(), rawToken);
        auditLogService.log(savedUser.getId(), "USER_REGISTERED", "Public registration completed with forced ROLE_STUDENT", ipAddress, userAgent);

        return getUserProfile(savedUser.getId());
    }

    /**
     * Admin Endpoint for provisioning users with any role (ROLE_STUDENT, ROLE_EXAMINER, ROLE_ADMIN).
     */
    @Transactional
    public UserProfileResponse createAdminUser(AdminCreateUserRequest request, String ipAddress, String userAgent) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered!");
        }

        String targetRoleName = request.getRole().startsWith("ROLE_") ? request.getRole() : "ROLE_" + request.getRole();
        Role assignedRole = roleRepository.findByName(targetRoleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", targetRoleName));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .active(true)
                .emailVerified(true) // Admin created users are auto-verified
                .build();

        user.getRoles().add(assignedRole);
        User savedUser = userRepository.save(user);

        auditLogService.log(savedUser.getId(), "ADMIN_USER_CREATED", "Admin created user with role: " + assignedRole.getName(), ipAddress, userAgent);

        return getUserProfile(savedUser.getId());
    }

    /**
     * Email Verification End-to-End
     */
    @Transactional
    public void verifyEmail(VerifyEmailRequest request, String ipAddress, String userAgent) {
        String tokenHash = TokenHashUtils.hashToken(request.getToken());

        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByTokenHashAndUsedFalse(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired email verification token"));

        if (verificationToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Email verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);

        auditLogService.log(user.getId(), "EMAIL_VERIFIED", "User email address successfully verified", ipAddress, userAgent);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String ipAddress, String userAgent) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String rawToken = UUID.randomUUID().toString();
            String tokenHash = TokenHashUtils.hashToken(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(Instant.now().plusSeconds(1800)) // 30 mins
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);

            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
            auditLogService.log(user.getId(), "PASSWORD_RESET_REQUESTED", "Password reset link dispatched", ipAddress, userAgent);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress, String userAgent) {
        String tokenHash = TokenHashUtils.hashToken(request.getToken());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHashAndUsedFalse(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token"));

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Password reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Single-Active-Session Enforcement: Invalidate all sessions on password reset
        userSessionRepository.invalidateAllActiveSessionsForUser(user);

        auditLogService.log(user.getId(), "PASSWORD_RESET_COMPLETED", "Password successfully reset and sessions revoked", ipAddress, userAgent);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        List<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .distinct()
                .collect(Collectors.toList());

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .active(user.isActive())
                .emailVerified(user.isEmailVerified())
                .roles(roles)
                .permissions(permissions)
                .build();
    }
}
