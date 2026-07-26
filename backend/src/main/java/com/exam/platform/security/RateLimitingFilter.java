package com.exam.platform.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static class RequestTracker {
        long windowStartTimestamp = System.currentTimeMillis();
        int requestCount = 0;
    }

    private final Map<String, RequestTracker> authTrackerMap = new ConcurrentHashMap<>();
    private final Map<String, RequestTracker> sensitiveTrackerMap = new ConcurrentHashMap<>();

    private static final int AUTH_LIMIT_PER_MINUTE = 5;
    private static final int SENSITIVE_LIMIT_PER_MINUTE = 30;
    private static final long ONE_MINUTE_MS = 60_000L;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        if (isAuthEndpoint(path)) {
            if (isRateLimited(clientIp, authTrackerMap, AUTH_LIMIT_PER_MINUTE)) {
                sendRateLimitError(response, "Too many authentication requests. Please wait 60 seconds before retrying.");
                return;
            }
        } else if (isSensitiveEndpoint(path)) {
            if (isRateLimited(clientIp, sensitiveTrackerMap, SENSITIVE_LIMIT_PER_MINUTE)) {
                sendRateLimitError(response, "Too many request submissions to sensitive endpoint. Rate limit exceeded.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAuthEndpoint(String path) {
        return path.startsWith("/api/v1/auth/login") ||
                path.startsWith("/api/v1/auth/register") ||
                path.startsWith("/api/v1/auth/forgot-password") ||
                path.startsWith("/api/v1/auth/reset-password");
    }

    private boolean isSensitiveEndpoint(String path) {
        return path.contains("/violations") || path.startsWith("/api/v1/snapshots/upload");
    }

    private boolean isRateLimited(String clientKey, Map<String, RequestTracker> trackerMap, int maxLimit) {
        long now = System.currentTimeMillis();
        RequestTracker tracker = trackerMap.computeIfAbsent(clientKey, k -> new RequestTracker());

        synchronized (tracker) {
            if (now - tracker.windowStartTimestamp > ONE_MINUTE_MS) {
                tracker.windowStartTimestamp = now;
                tracker.requestCount = 1;
                return false;
            }

            tracker.requestCount++;
            if (tracker.requestCount > maxLimit) {
                log.warn("Rate limit exceeded for client key {}: {}/{} reqs in current window", clientKey, tracker.requestCount, maxLimit);
                return true;
            }
        }
        return false;
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void sendRateLimitError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = Map.of(
                "success", false,
                "message", message,
                "statusCode", 429,
                "timestamp", System.currentTimeMillis()
        );

        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(body));
    }
}
