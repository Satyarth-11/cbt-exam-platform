package com.exam.platform.security;

import com.exam.platform.entity.UserSession;
import com.exam.platform.repository.UserSessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final CustomUserDetailsService userDetailsService;
    private final UserSessionRepository userSessionRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String jwt = parseJwt(request);

        if (jwt != null && jwtProvider.validateJwtToken(jwt)) {
            try {
                String userIdStr = jwtProvider.getUserIdFromJwt(jwt);
                String sessionIdStr = jwtProvider.getSessionIdFromJwt(jwt);

                if (sessionIdStr != null) {
                    UUID sessionId = UUID.fromString(sessionIdStr);
                    Optional<UserSession> sessionOpt = userSessionRepository.findByIdAndActiveTrue(sessionId);

                    // Single-Active-Session Enforcement Check
                    // CRITICAL: return immediately, do NOT call filterChain.doFilter
                    if (sessionOpt.isEmpty()) {
                        log.warn("SECURITY: Session {} for user {} was invalidated (login from another device)", sessionId, userIdStr);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write(
                            "{\"success\":false,\"message\":\"Session invalidated. Logged in from another device.\",\"errorCode\":\"ERR_SESSION_INVALIDATED\"}"
                        );
                        response.getWriter().flush();
                        return; // Stop filter chain — do NOT proceed
                    }

                    // Session is valid: update last active timestamp
                    UserSession session = sessionOpt.get();
                    session.setLastActiveAt(Instant.now());
                    userSessionRepository.save(session);
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(userIdStr);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                log.error("JWT authentication failed: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
