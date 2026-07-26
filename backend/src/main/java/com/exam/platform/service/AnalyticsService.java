package com.exam.platform.service;

import com.exam.platform.dto.analytics.*;
import com.exam.platform.entity.*;
import com.exam.platform.exception.ResourceNotFoundException;
import com.exam.platform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ExamAttemptRepository attemptRepository;
    private final ExamResultRepository resultRepository;
    private final CandidateAnswerRepository candidateAnswerRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final ProctorViolationRepository violationRepository;

    @Transactional(readOnly = true)
    public DetailedScorecardDto getDetailedScorecard(UUID attemptId, UUID requestingUserId, boolean isAdmin) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamAttempt", "id", attemptId));

        if (!isAdmin && !attempt.getUser().getId().equals(requestingUserId)) {
            throw new IllegalArgumentException("Unauthorized access to candidate scorecard");
        }

        Exam exam = attempt.getExam();
        ExamResult result = resultRepository.findByAttempt(attempt).orElse(null);
        List<CandidateAnswer> answers = candidateAnswerRepository.findByAttempt(attempt);
        List<Question> questions = questionRepository.findByExamOrderBySequenceNumberAsc(exam);

        long totalCandidates = attemptRepository.countByExam(exam);
        long durationSec = attempt.getSubmittedAt() != null && attempt.getStartedAt() != null
                ? Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).toSeconds()
                : 0L;

        // Subject performance breakdown
        Map<String, List<Question>> subjectQuestionsMap = questions.stream()
                .collect(Collectors.groupingBy(q -> q.getSubject() != null ? q.getSubject().toUpperCase() : "GENERAL"));

        List<SubjectPerformanceDto> subjectBreakdown = new ArrayList<>();
        long seed = attempt.getShuffleSeed() != null ? attempt.getShuffleSeed() : 0L;

        for (Map.Entry<String, List<Question>> entry : subjectQuestionsMap.entrySet()) {
            String subject = entry.getKey();
            List<Question> subQuestions = entry.getValue();

            int correct = 0;
            int incorrect = 0;
            int unattempted = 0;
            double obtained = 0.0;
            double maxMarks = subQuestions.size() * 4.0;

            for (Question q : subQuestions) {
                CandidateAnswer ans = answers.stream()
                        .filter(a -> a.getQuestion().getId().equals(q.getId()))
                        .findFirst().orElse(null);

                if (ans == null || isUnattempted(ans)) {
                    unattempted++;
                } else {
                    boolean isCorrect = checkAnswerCorrectness(ans, q, seed);
                    if (isCorrect) {
                        correct++;
                        obtained += q.getMarkingPositive();
                    } else {
                        incorrect++;
                        obtained -= q.getMarkingNegative();
                    }
                }
            }

            double accuracy = (correct + incorrect) > 0 ? (correct * 100.0 / (correct + incorrect)) : 0.0;

            subjectBreakdown.add(SubjectPerformanceDto.builder()
                    .subject(subject)
                    .totalQuestions(subQuestions.size())
                    .correctCount(correct)
                    .incorrectCount(incorrect)
                    .unattemptedCount(unattempted)
                    .marksObtained(obtained)
                    .maxMarks(maxMarks)
                    .accuracyPercentage(Math.round(accuracy * 10.0) / 10.0)
                    .build());
        }

        // Question-by-question review items
        List<QuestionReviewDto> questionReviews = questions.stream().map(q -> {
            CandidateAnswer ans = answers.stream()
                    .filter(a -> a.getQuestion().getId().equals(q.getId()))
                    .findFirst().orElse(null);

            String status = "UNATTEMPTED";
            double marksAwarded = 0.0;
            String selOpt = ans != null ? ans.getSelectedOption() : null;
            Double selNum = ans != null ? ans.getNumericalAnswer() : null;

            if (ans != null && !isUnattempted(ans)) {
                boolean isCorrect = checkAnswerCorrectness(ans, q, seed);
                if (isCorrect) {
                    status = "CORRECT";
                    marksAwarded = q.getMarkingPositive();
                } else {
                    status = "INCORRECT";
                    marksAwarded = -q.getMarkingNegative();
                }
            }

            return QuestionReviewDto.builder()
                    .questionId(q.getId())
                    .sequenceNumber(q.getSequenceNumber())
                    .subject(q.getSubject())
                    .section(q.getSection())
                    .questionType(q.getQuestionType())
                    .questionText(q.getQuestionText())
                    .passageText(q.getPassageText())
                    .optionA(q.getOptionA())
                    .optionB(q.getOptionB())
                    .optionC(q.getOptionC())
                    .optionD(q.getOptionD())
                    .selectedOption(selOpt)
                    .correctOption(q.getCorrectOption())
                    .selectedNumericalValue(selNum)
                    .correctNumericalValue(q.getCorrectNumericalValue())
                    .status(status)
                    .marksAwarded(marksAwarded)
                    .explanation(q.getExplanation() != null ? q.getExplanation() : "Solution explanation available in reference answer key.")
                    .build();
        }).collect(Collectors.toList());

        return DetailedScorecardDto.builder()
                .attemptId(attempt.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .candidateName(attempt.getUser().getFirstName() + " " + attempt.getUser().getLastName())
                .candidateEmail(attempt.getUser().getEmail())
                .score(attempt.getScore() != null ? attempt.getScore() : 0.0)
                .totalMarks(exam.getTotalMarks())
                .percentage(attempt.getPercentage() != null ? attempt.getPercentage() : 0.0)
                .percentile(result != null && result.getPercentile() != null ? result.getPercentile() : 0.0)
                .rankPosition(attempt.getRankPosition() != null ? attempt.getRankPosition() : 1)
                .totalCandidates(totalCandidates)
                .status(attempt.getStatus())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .durationSeconds(durationSec)
                .feedbackSummary(result != null ? result.getFeedbackSummary() : "Exam evaluated.")
                .subjectBreakdown(subjectBreakdown)
                .questionReviews(questionReviews)
                .build();
    }

    @Transactional(readOnly = true)
    public ExamAnalyticsReportDto getExamAnalyticsReport(UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", examId));

        List<ExamAttempt> attempts = attemptRepository.findByExam(exam).stream()
                .filter(a -> !"IN_PROGRESS".equals(a.getStatus()) && !"NOT_STARTED".equals(a.getStatus()))
                .collect(Collectors.toList());

        long totalAttempted = attempts.size();
        if (totalAttempted == 0) {
            return ExamAnalyticsReportDto.builder()
                    .examId(exam.getId())
                    .examTitle(exam.getTitle())
                    .subject(exam.getSubject())
                    .totalCandidatesAttempted(0)
                    .averageScore(0.0)
                    .highestScore(0.0)
                    .lowestScore(0.0)
                    .medianScore(0.0)
                    .passPercentage(0.0)
                    .scoreDistribution(Map.of("0-25%", 0, "26-50%", 0, "51-75%", 0, "76-100%", 0))
                    .subjectAverages(Collections.emptyList())
                    .candidateRankings(Collections.emptyList())
                    .build();
        }

        List<Double> scores = attempts.stream()
                .map(a -> a.getScore() != null ? a.getScore() : 0.0)
                .sorted()
                .collect(Collectors.toList());

        double avgScore = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double highest = scores.get(scores.size() - 1);
        double lowest = scores.get(0);
        double median = scores.size() % 2 == 0
                ? (scores.get(scores.size() / 2 - 1) + scores.get(scores.size() / 2)) / 2.0
                : scores.get(scores.size() / 2);

        long passedCount = attempts.stream().filter(a -> (a.getPercentage() != null ? a.getPercentage() : 0.0) >= 40.0).count();
        double passPct = (passedCount * 100.0) / totalAttempted;

        // Score Distribution Buckets
        int b1 = 0, b2 = 0, b3 = 0, b4 = 0;
        for (ExamAttempt a : attempts) {
            double pct = a.getPercentage() != null ? a.getPercentage() : 0.0;
            if (pct <= 25) b1++;
            else if (pct <= 50) b2++;
            else if (pct <= 75) b3++;
            else b4++;
        }

        Map<String, Integer> scoreDist = Map.of(
            "0-25%", b1,
            "26-50%", b2,
            "51-75%", b3,
            "76-100%", b4
        );

        // Subject averages
        List<Question> questions = questionRepository.findByExamOrderBySequenceNumberAsc(exam);
        Map<String, List<Question>> subjectMap = questions.stream()
                .collect(Collectors.groupingBy(q -> q.getSubject() != null ? q.getSubject().toUpperCase() : "GENERAL"));

        List<SubjectPerformanceDto> subjectAverages = subjectMap.entrySet().stream().map(entry -> {
            String sub = entry.getKey();
            List<Question> subQList = entry.getValue();

            double avgSubScore = 0.0;
            for (ExamAttempt att : attempts) {
                ExamResult res = resultRepository.findByAttempt(att).orElse(null);
                if (res != null) {
                    if ("PHYSICS".equalsIgnoreCase(sub)) avgSubScore += (res.getPhysicsScore() != null ? res.getPhysicsScore() : 0);
                    else if ("CHEMISTRY".equalsIgnoreCase(sub)) avgSubScore += (res.getChemistryScore() != null ? res.getChemistryScore() : 0);
                    else if ("MATHEMATICS".equalsIgnoreCase(sub)) avgSubScore += (res.getMathsScore() != null ? res.getMathsScore() : 0);
                }
            }
            avgSubScore = avgSubScore / totalAttempted;

            return SubjectPerformanceDto.builder()
                    .subject(sub)
                    .totalQuestions(subQList.size())
                    .marksObtained(Math.round(avgSubScore * 10.0) / 10.0)
                    .maxMarks(subQList.size() * 4.0)
                    .accuracyPercentage(Math.round((avgSubScore / (subQList.size() * 4.0)) * 100.0 * 10.0) / 10.0)
                    .build();
        }).collect(Collectors.toList());

        // Candidate Rankings sorted by score descending
        List<ExamAttempt> sortedAttempts = new ArrayList<>(attempts);
        sortedAttempts.sort((a, b) -> Double.compare(b.getScore() != null ? b.getScore() : 0.0, a.getScore() != null ? a.getScore() : 0.0));

        List<CandidateRankDto> candidateRankings = new ArrayList<>();
        for (int i = 0; i < sortedAttempts.size(); i++) {
            ExamAttempt att = sortedAttempts.get(i);
            long violationCount = violationRepository.countByAttempt(att);
            ExamResult res = resultRepository.findByAttempt(att).orElse(null);

            candidateRankings.add(CandidateRankDto.builder()
                    .rank(i + 1)
                    .attemptId(att.getId())
                    .userId(att.getUser().getId())
                    .candidateName(att.getUser().getFirstName() + " " + att.getUser().getLastName())
                    .email(att.getUser().getEmail())
                    .score(att.getScore() != null ? att.getScore() : 0.0)
                    .percentage(att.getPercentage() != null ? att.getPercentage() : 0.0)
                    .percentile(res != null && res.getPercentile() != null ? res.getPercentile() : 0.0)
                    .status(att.getStatus())
                    .violationCount(violationCount)
                    .submittedAt(att.getSubmittedAt())
                    .build());
        }

        return ExamAnalyticsReportDto.builder()
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .subject(exam.getSubject())
                .totalCandidatesAttempted(totalAttempted)
                .averageScore(Math.round(avgScore * 10.0) / 10.0)
                .highestScore(highest)
                .lowestScore(lowest)
                .medianScore(median)
                .passPercentage(Math.round(passPct * 10.0) / 10.0)
                .scoreDistribution(scoreDist)
                .subjectAverages(subjectAverages)
                .candidateRankings(candidateRankings)
                .build();
    }

    @Transactional(readOnly = true)
    public String exportExamResultsCsv(UUID examId) {
        ExamAnalyticsReportDto report = getExamAnalyticsReport(examId);
        StringBuilder csv = new StringBuilder();
        csv.append("Rank,Candidate Name,Email,Score,Percentage,Percentile,Status,Violations Count,Submitted At\n");

        for (CandidateRankDto r : report.getCandidateRankings()) {
            csv.append(String.format("%d,\"%s\",\"%s\",%.2f,%.2f,%.2f,\"%s\",%d,\"%s\"\n",
                    r.getRank(),
                    r.getCandidateName(),
                    r.getEmail(),
                    r.getScore(),
                    r.getPercentage(),
                    r.getPercentile(),
                    r.getStatus(),
                    r.getViolationCount(),
                    r.getSubmittedAt() != null ? r.getSubmittedAt().toString() : "N/A"
            ));
        }

        return csv.toString();
    }

    private boolean isUnattempted(CandidateAnswer ans) {
        return (ans.getSelectedOption() == null || ans.getSelectedOption().trim().isEmpty())
                && ans.getNumericalAnswer() == null;
    }

    private boolean checkAnswerCorrectness(CandidateAnswer ans, Question q, long seed) {
        if ("MCQ".equals(q.getQuestionType()) || "MULTIPLE_CHOICE".equals(q.getQuestionType())) {
            String mappedOption = mapSelectedOptionBack(ans.getSelectedOption(), q, seed);
            return mappedOption != null && mappedOption.equalsIgnoreCase(q.getCorrectOption());
        } else if ("NUMERICAL".equals(q.getQuestionType())) {
            return ans.getNumericalAnswer() != null && q.getCorrectNumericalValue() != null
                    && Math.abs(ans.getNumericalAnswer() - q.getCorrectNumericalValue()) < 0.001;
        }
        return false;
    }

    private String mapSelectedOptionBack(String selectedOptionShuffled, Question q, long seed) {
        if (selectedOptionShuffled == null || selectedOptionShuffled.trim().isEmpty()) {
            return null;
        }
        String[] selectedLetters = selectedOptionShuffled.split(",");
        List<String> originalLetters = List.of("A", "B", "C", "D");
        List<String> originalOptions = List.of(
                q.getOptionA() != null ? q.getOptionA() : "",
                q.getOptionB() != null ? q.getOptionB() : "",
                q.getOptionC() != null ? q.getOptionC() : "",
                q.getOptionD() != null ? q.getOptionD() : ""
        );

        List<String> shuffledOptions = new ArrayList<>(originalOptions);
        long qSeed = seed + q.getId().hashCode();
        Collections.shuffle(shuffledOptions, new Random(qSeed));

        List<String> mappedLetters = new ArrayList<>();
        for (String letter : selectedLetters) {
            int indexShuffled = originalLetters.indexOf(letter.trim().toUpperCase());
            if (indexShuffled >= 0 && indexShuffled < shuffledOptions.size()) {
                String text = shuffledOptions.get(indexShuffled);
                int originalIndex = originalOptions.indexOf(text);
                if (originalIndex >= 0) {
                    mappedLetters.add(originalLetters.get(originalIndex));
                }
            }
        }
        Collections.sort(mappedLetters);
        return String.join(",", mappedLetters);
    }
}
