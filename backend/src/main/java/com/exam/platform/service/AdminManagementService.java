package com.exam.platform.service;

import com.exam.platform.dto.admin.ExamRequestDto;
import com.exam.platform.dto.admin.QuestionRequestDto;
import com.exam.platform.dto.admin.UserRoleUpdateRequest;
import com.exam.platform.dto.auth.UserProfileResponse;
import com.exam.platform.dto.dashboard.ExamSummaryDto;
import com.exam.platform.entity.*;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminManagementService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    // --- 1. EXAM LIFECYCLE MANAGEMENT ---

    @Transactional(readOnly = true)
    public List<ExamSummaryDto> getAllExams() {
        return examRepository.findAll().stream()
                .map(this::mapToExamSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExamSummaryDto getExamById(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", examId));
        return mapToExamSummaryDto(exam);
    }

    @Transactional
    public ExamSummaryDto createExam(ExamRequestDto request, UUID adminUserId) {
        Exam exam = Exam.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .subject(request.getSubject().toUpperCase())
                .totalQuestions(request.getTotalQuestions())
                .totalMarks(request.getTotalMarks())
                .durationMinutes(request.getDurationMinutes())
                .scheduledStartTime(request.getScheduledStartTime())
                .scheduledEndTime(request.getScheduledEndTime())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "SCHEDULED")
                .maxViolations(request.getMaxViolations() != null ? request.getMaxViolations() : 3)
                .build();

        Exam savedExam = examRepository.save(exam);
        auditLogService.log(adminUserId, "EXAM_CREATED", "Created exam: " + savedExam.getTitle() + " (ID: " + savedExam.getId() + ")", "127.0.0.1", "Admin Console");
        log.info("Admin {} created new exam: {}", adminUserId, savedExam.getId());

        return mapToExamSummaryDto(savedExam);
    }

    @Transactional
    public ExamSummaryDto updateExam(UUID examId, ExamRequestDto request, UUID adminUserId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", examId));

        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setSubject(request.getSubject().toUpperCase());
        exam.setTotalQuestions(request.getTotalQuestions());
        exam.setTotalMarks(request.getTotalMarks());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setScheduledStartTime(request.getScheduledStartTime());
        exam.setScheduledEndTime(request.getScheduledEndTime());
        if (request.getStatus() != null) {
            exam.setStatus(request.getStatus().toUpperCase());
        }
        if (request.getMaxViolations() != null) {
            exam.setMaxViolations(request.getMaxViolations());
        }

        Exam updatedExam = examRepository.save(exam);
        auditLogService.log(adminUserId, "EXAM_UPDATED", "Updated exam: " + updatedExam.getTitle() + " (ID: " + updatedExam.getId() + ")", "127.0.0.1", "Admin Console");
        log.info("Admin {} updated exam: {}", adminUserId, examId);

        return mapToExamSummaryDto(updatedExam);
    }

    @Transactional
    public void deleteExam(UUID examId, UUID adminUserId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", examId));

        examRepository.delete(exam);
        auditLogService.log(adminUserId, "EXAM_DELETED", "Deleted exam: " + exam.getTitle() + " (ID: " + examId + ")", "127.0.0.1", "Admin Console");
        log.info("Admin {} deleted exam: {}", adminUserId, examId);
    }

    // --- 2. QUESTION BANK BUILDER ---

    @Transactional(readOnly = true)
    public List<Question> getQuestionsForExam(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", examId));
        return questionRepository.findByExamOrderBySequenceNumberAsc(exam);
    }

    @Transactional
    public Question addQuestionToExam(UUID examId, QuestionRequestDto request, UUID adminUserId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", examId));

        Question parent = null;
        if (request.getParentQuestionId() != null) {
            parent = questionRepository.findById(request.getParentQuestionId()).orElse(null);
        }

        Question question = Question.builder()
                .exam(exam)
                .subject(request.getSubject().toUpperCase())
                .section(request.getSection() != null ? request.getSection().toUpperCase() : "SECTION_A")
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType() != null ? request.getQuestionType().toUpperCase() : "MCQ")
                .optionA(request.getOptionA())
                .optionB(request.getOptionB())
                .optionC(request.getOptionC())
                .optionD(request.getOptionD())
                .correctOption(request.getCorrectOption())
                .correctNumericalValue(request.getCorrectNumericalValue())
                .markingPositive(request.getMarkingPositive() != null ? request.getMarkingPositive() : 4)
                .markingNegative(request.getMarkingNegative() != null ? request.getMarkingNegative() : 1)
                .sequenceNumber(request.getSequenceNumber())
                .parentQuestion(parent)
                .passageText(request.getPassageText())
                .explanation(request.getExplanation())
                .build();

        Question saved = questionRepository.save(question);
        log.info("Admin {} added question {} to exam {}", adminUserId, saved.getId(), examId);
        return saved;
    }

    @Transactional
    public Question updateQuestion(UUID questionId, QuestionRequestDto request, UUID adminUserId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));

        Question parent = null;
        if (request.getParentQuestionId() != null) {
            parent = questionRepository.findById(request.getParentQuestionId()).orElse(null);
        }

        question.setSubject(request.getSubject().toUpperCase());
        question.setSection(request.getSection() != null ? request.getSection().toUpperCase() : "SECTION_A");
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType() != null ? request.getQuestionType().toUpperCase() : "MCQ");
        question.setOptionA(request.getOptionA());
        question.setOptionB(request.getOptionB());
        question.setOptionC(request.getOptionC());
        question.setOptionD(request.getOptionD());
        question.setCorrectOption(request.getCorrectOption());
        question.setCorrectNumericalValue(request.getCorrectNumericalValue());
        if (request.getMarkingPositive() != null) question.setMarkingPositive(request.getMarkingPositive());
        if (request.getMarkingNegative() != null) question.setMarkingNegative(request.getMarkingNegative());
        if (request.getSequenceNumber() != null) question.setSequenceNumber(request.getSequenceNumber());
        question.setParentQuestion(parent);
        question.setPassageText(request.getPassageText());
        question.setExplanation(request.getExplanation());

        Question updated = questionRepository.save(question);
        log.info("Admin {} updated question {}", adminUserId, questionId);
        return updated;
    }

    @Transactional
    public void deleteQuestion(UUID questionId, UUID adminUserId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));
        questionRepository.delete(question);
        log.info("Admin {} deleted question {}", adminUserId, questionId);
    }

    // --- 3. USER MANAGEMENT CONSOLE ---

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserProfileResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserProfileResponse toggleUserStatus(UUID userId, boolean active, UUID adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setActive(active);
        User saved = userRepository.save(user);

        auditLogService.log(adminUserId, "USER_STATUS_TOGGLED", "Set active = " + active + " for user: " + user.getUsername(), "127.0.0.1", "Admin Console");
        return mapToUserProfileResponse(saved);
    }

    @Transactional
    public UserProfileResponse updateUserRoles(UUID userId, UserRoleUpdateRequest request, UUID adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Set<Role> roles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            String fullRoleName = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
            Role role = roleRepository.findByName(fullRoleName)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + fullRoleName));
            roles.add(role);
        }

        user.setRoles(roles);
        User saved = userRepository.save(user);

        auditLogService.log(adminUserId, "USER_ROLES_UPDATED", "Updated roles for user: " + user.getUsername() + " to " + request.getRoles(), "127.0.0.1", "Admin Console");
        return mapToUserProfileResponse(saved);
    }

    @Transactional
    public void adminResetPassword(UUID userId, String newPassword, UUID adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        auditLogService.log(adminUserId, "USER_PASSWORD_RESET", "Admin reset password for user: " + user.getUsername(), "127.0.0.1", "Admin Console");
    }

    // --- HELPERS ---

    private ExamSummaryDto mapToExamSummaryDto(Exam exam) {
        return ExamSummaryDto.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .subject(exam.getSubject())
                .totalQuestions(exam.getTotalQuestions())
                .totalMarks(exam.getTotalMarks())
                .durationMinutes(exam.getDurationMinutes())
                .scheduledStartTime(exam.getScheduledStartTime())
                .scheduledEndTime(exam.getScheduledEndTime())
                .status(exam.getStatus())
                .build();
    }

    private UserProfileResponse mapToUserProfileResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(roles)
                .active(user.isActive())
                .emailVerified(user.isEmailVerified())
                .build();
    }
}
