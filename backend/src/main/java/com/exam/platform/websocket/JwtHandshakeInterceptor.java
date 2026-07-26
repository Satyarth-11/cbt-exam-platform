package com.exam.platform.websocket;

import com.exam.platform.entity.UserSession;
import com.exam.platform.repository.UserSessionRepository;
import com.exam.platform.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtProvider jwtProvider;
    private final UserSessionRepository userSessionRepository;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        URI uri = request.getURI();
        String query = uri.getQuery();
        String token = parseTokenFromQuery(query);

        if (!StringUtils.hasText(token) || !jwtProvider.validateJwtToken(token)) {
            log.warn("WebSocket Handshake REJECTED: Missing or invalid JWT token in query string: {}", query);
            return false;
        }

        try {
            String userIdStr = jwtProvider.getUserIdFromJwt(token);
            String sessionIdStr = jwtProvider.getSessionIdFromJwt(token);
            List<String> roles = jwtProvider.getRolesFromJwt(token);

            if (sessionIdStr != null) {
                UUID sessionId = UUID.fromString(sessionIdStr);
                Optional<UserSession> sessionOpt = userSessionRepository.findByIdAndActiveTrue(sessionId);
                if (sessionOpt.isEmpty()) {
                    log.warn("WebSocket Handshake REJECTED: Session {} for user {} was invalidated/expired", sessionId, userIdStr);
                    return false;
                }
            }

            UUID userId = UUID.fromString(userIdStr);
            attributes.put("userId", userId);
            attributes.put("roles", roles != null ? roles : Collections.emptyList());
            if (sessionIdStr != null) {
                attributes.put("sessionId", UUID.fromString(sessionIdStr));
            }

            log.info("WebSocket Handshake APPROVED for user: {} with roles: {}", userId, roles);
            return true;
        } catch (Exception e) {
            log.error("WebSocket Handshake ERROR during JWT parsing: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // No post-handshake action required
    }

    private String parseTokenFromQuery(String query) {
        if (!StringUtils.hasText(query)) return null;
        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            if (pair.length >= 2 && ("token".equalsIgnoreCase(pair[0]) || "access_token".equalsIgnoreCase(pair[0]))) {
                return pair[1];
            }
        }
        return null;
    }
}
