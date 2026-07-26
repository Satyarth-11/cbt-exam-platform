package com.exam.platform.service;

import com.exam.platform.entity.Question;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class DocumentParserService {

    @Data
    @Builder
    public static class ParsedQuestionDto {
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctOption;
        private Double correctNumericalValue;
        private String questionType; // MCQ, NUMERICAL
        private String explanation;
    }

    public String extractTextFromPdf(InputStream inputStream) throws Exception {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    public String extractTextFromDocx(InputStream inputStream) throws Exception {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    public List<ParsedQuestionDto> parseQuestionsFromText(String rawText) {
        List<ParsedQuestionDto> questions = new ArrayList<>();
        if (rawText == null || rawText.isBlank()) return questions;

        // Split text by Question delimiters (e.g., Q1., Q 1., Question 1:, 1.)
        String[] blocks = rawText.split("(?i)(?=\\b(?:Q|Question|Que|Item)?\\s*\\d+[.:)])");

        for (String block : blocks) {
            String trimmed = block.trim();
            if (trimmed.length() < 10) continue;

            // Pattern for Options A, B, C, D
            String optionAPattern = "(?i)\\b[A][.:)]\\s*(.+?)(?=\\b[B][.:)]|Answer|Ans|Explanation|$)";
            String optionBPattern = "(?i)\\b[B][.:)]\\s*(.+?)(?=\\b[C][.:)]|Answer|Ans|Explanation|$)";
            String optionCPattern = "(?i)\\b[C][.:)]\\s*(.+?)(?=\\b[D][.:)]|Answer|Ans|Explanation|$)";
            String optionDPattern = "(?i)\\b[D][.:)]\\s*(.+?)(?=Answer|Ans|Explanation|$)";
            String answerPattern = "(?i)\\b(?:Answer|Ans|Correct Choice|Correct Option)[.:\\s]*([A-D]|[0-9]+(?:\\.[0-9]+)?)";
            String explanationPattern = "(?i)\\b(?:Explanation|Solution|Sol)[.:\\s]*(.+)";

            String optA = extractMatch(trimmed, optionAPattern);
            String optB = extractMatch(trimmed, optionBPattern);
            String optC = extractMatch(trimmed, optionCPattern);
            String optD = extractMatch(trimmed, optionDPattern);
            String ans = extractMatch(trimmed, answerPattern);
            String exp = extractMatch(trimmed, explanationPattern);

            // Question Statement (everything before Option A or Answer)
            String qText = trimmed.split("(?i)\\b[A][.:)]|Answer:|Ans:|Explanation:")[0].replaceAll("^\\s*(?:Q|Question|Que)?\\s*\\d+[.:)]\\s*", "").trim();
            if (qText.isEmpty()) qText = trimmed.substring(0, Math.min(trimmed.length(), 150));

            String correctOption = "A";
            Double numericalVal = null;
            String type = "MCQ";

            if (ans != null) {
                String cleanAns = ans.trim().toUpperCase();
                if (cleanAns.matches("[A-D]")) {
                    correctOption = cleanAns;
                } else try {
                    numericalVal = Double.parseDouble(cleanAns);
                    type = "NUMERICAL";
                } catch (Exception ignored) {}
            }

            // Fallback default options if options are sparse
            if (optA == null) optA = "Option A";
            if (optB == null) optB = "Option B";
            if (optC == null) optC = "Option C";
            if (optD == null) optD = "Option D";
            if (exp == null) exp = "Standard step-by-step solution for question: " + (qText.length() > 60 ? qText.substring(0, 60) + "..." : qText);

            ParsedQuestionDto dto = ParsedQuestionDto.builder()
                    .questionText(qText)
                    .optionA(optA)
                    .optionB(optB)
                    .optionC(optC)
                    .optionD(optD)
                    .correctOption(correctOption)
                    .correctNumericalValue(numericalVal)
                    .questionType(type)
                    .explanation(exp)
                    .build();

            questions.add(dto);
        }

        return questions;
    }

    private String extractMatch(String text, String regex) {
        Pattern pattern = Pattern.compile(regex, Pattern.DOTALL);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }
}
