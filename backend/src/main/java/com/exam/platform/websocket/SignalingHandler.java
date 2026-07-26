package com.exam.platform.websocket;

import com.exam.platform.entity.ExamAttempt;
import com.exam.platform.repository.ExamAttemptRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
@RequiredArgsConstructor
public class SignalingHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExamAttemptRepository attemptRepository;

    // Key: attemptId, Value: WebSocketSession of Candidate
    private static final Map<String, WebSocketSession> candidateSessions = new ConcurrentHashMap<>();
    
    // List of connected proctor sessions
    private static final List<WebSocketSession> proctorSessions = new CopyOnWriteArrayList<>();

    // Map to track the role/identity of each WebSocketSession
    private static final Map<WebSocketSession, String> sessionRoles = new ConcurrentHashMap<>();
    private static final Map<WebSocketSession, String> sessionAttemptIds = new ConcurrentHashMap<>();

    public static int getActiveCandidateCount() {
        return candidateSessions.size();
    }

    public static int getActiveProctorCount() {
        return proctorSessions.size();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("New WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        Map<String, Object> msg;
        try {
            msg = objectMapper.readValue(payload, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse signaling message: {}", payload, e);
            return;
        }

        String type = (String) msg.get("type");
        if (type == null) return;

        switch (type) {
            case "register":
                handleRegister(session, msg);
                break;
            case "offer":
            case "answer":
            case "ice-candidate":
                handleSignalingMessage(session, msg, message);
                break;
            case "warning":
                handleWarning(session, msg, message);
                break;
            default:
                log.warn("Unknown message type: {}", type);
        }
    }

    @SuppressWarnings("unchecked")
    private void handleRegister(WebSocketSession session, Map<String, Object> msg) {
        String requestedRole = (String) msg.get("role");
        String attemptIdStr = (String) msg.get("attemptId");

        UUID authenticatedUserId = (UUID) session.getAttributes().get("userId");
        List<String> userRoles = (List<String>) session.getAttributes().get("roles");

        if (authenticatedUserId == null || userRoles == null) {
            log.warn("Unauthenticated WebSocket session attempt in handleRegister: {}", session.getId());
            return;
        }

        if ("proctor".equalsIgnoreCase(requestedRole)) {
            // CRITICAL SECURITY: Server-side role check. Must hold ROLE_ADMIN or ROLE_EXAMINER.
            boolean isAuthorizedProctor = userRoles.contains("ROLE_ADMIN") || userRoles.contains("ROLE_EXAMINER");
            if (!isAuthorizedProctor) {
                log.warn("SECURITY ALERT: User {} with roles {} attempted unauthorized proctor registration!", 
                        authenticatedUserId, userRoles);
                return;
            }

            proctorSessions.add(session);
            sessionRoles.put(session, "proctor");
            log.info("Registered Proctor session for user: {}", authenticatedUserId);

        } else if ("candidate".equalsIgnoreCase(requestedRole) && attemptIdStr != null) {
            // CRITICAL SECURITY: Verify attemptId belongs to the authenticated user
            try {
                UUID attemptId = UUID.fromString(attemptIdStr);
                Optional<ExamAttempt> attemptOpt = attemptRepository.findById(attemptId);

                if (attemptOpt.isEmpty()) {
                    log.warn("Candidate registration failed: Attempt ID {} not found", attemptIdStr);
                    return;
                }

                ExamAttempt attempt = attemptOpt.get();
                if (!attempt.getUser().getId().equals(authenticatedUserId)) {
                    log.warn("SECURITY ALERT: Candidate user {} attempted to register attemptId {} belonging to user {}", 
                            authenticatedUserId, attemptIdStr, attempt.getUser().getId());
                    return;
                }

                candidateSessions.put(attemptIdStr, session);
                sessionRoles.put(session, "candidate");
                sessionAttemptIds.put(session, attemptIdStr);
                log.info("Registered Candidate session for user: {} on attempt ID: {}", authenticatedUserId, attemptIdStr);
                
                // Notify active proctors
                broadcastToProctors(String.format("{\"type\":\"candidate_connected\",\"attemptId\":\"%s\"}", attemptIdStr));

            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID format for attemptId: {}", attemptIdStr);
            }
        }
    }

    private void handleSignalingMessage(WebSocketSession session, Map<String, Object> msg, TextMessage originalMessage) throws IOException {
        String role = sessionRoles.get(session);
        String target = (String) msg.get("target");

        if ("proctor".equals(role)) {
            // Proctor is sending offer/candidate to a specific Candidate
            if (target != null && candidateSessions.containsKey(target)) {
                WebSocketSession candidateSession = candidateSessions.get(target);
                if (candidateSession.isOpen()) {
                    candidateSession.sendMessage(originalMessage);
                }
            }
        } else if ("candidate".equals(role)) {
            // Candidate is sending offer/answer/candidate back to Proctors
            String attemptId = sessionAttemptIds.get(session);
            if (attemptId != null) {
                // Attach the sender's attempt ID so the proctor knows who sent it
                msg.put("sender", attemptId);
                String updatedPayload = objectMapper.writeValueAsString(msg);
                broadcastToProctors(updatedPayload);
            }
        }
    }

    private void handleWarning(WebSocketSession session, Map<String, Object> msg, TextMessage originalMessage) throws IOException {
        String role = sessionRoles.get(session);
        String target = (String) msg.get("target");

        if ("proctor".equals(role) && target != null) {
            WebSocketSession candidateSession = candidateSessions.get(target);
            if (candidateSession != null && candidateSession.isOpen()) {
                candidateSession.sendMessage(originalMessage);
                log.info("Forwarded proctor warning chat message to attempt: {}", target);
            }
        }
    }

    public static boolean sendControlCommandToCandidate(String attemptId, String commandType, String messagePayload) {
        WebSocketSession candidateSession = candidateSessions.get(attemptId);
        if (candidateSession != null && candidateSession.isOpen()) {
            try {
                Map<String, String> payloadMap = Map.of(
                        "type", "proctor_control",
                        "command", commandType,
                        "message", messagePayload != null ? messagePayload : ""
                );
                ObjectMapper mapper = new ObjectMapper();
                candidateSession.sendMessage(new TextMessage(mapper.writeValueAsString(payloadMap)));
                log.info("Successfully pushed proctor control command {} to attempt {}", commandType, attemptId);
                return true;
            } catch (IOException e) {
                log.error("Failed to send proctor control command {} to attempt {}", commandType, attemptId, e);
            }
        } else {
            log.warn("Cannot push proctor control command {}: candidate WS session for attempt {} is not active", commandType, attemptId);
        }
        return false;
    }

    private void broadcastToProctors(String payload) {
        TextMessage textMessage = new TextMessage(payload);
        for (WebSocketSession proctorSession : proctorSessions) {
            if (proctorSession.isOpen()) {
                try {
                    proctorSession.sendMessage(textMessage);
                } catch (IOException e) {
                    log.error("Failed to send message to proctor session: {}", proctorSession.getId(), e);
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String role = sessionRoles.remove(session);
        if ("candidate".equals(role)) {
            String attemptId = sessionAttemptIds.remove(session);
            if (attemptId != null) {
                candidateSessions.remove(attemptId);
                log.info("Candidate disconnected for attempt: {}", attemptId);
                broadcastToProctors(String.format("{\"type\":\"candidate_disconnected\",\"attemptId\":\"%s\"}", attemptId));
            }
        } else if ("proctor".equals(role)) {
            proctorSessions.remove(session);
            log.info("Proctor session closed: {}", session.getId());
        }
    }
}
