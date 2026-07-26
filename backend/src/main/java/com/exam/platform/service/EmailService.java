package com.exam.platform.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        String content = "<h3>Password Reset Request</h3>" +
                "<p>Click the link below to reset your National Testing Engine password:</p>" +
                "<p><a href=\"" + resetUrl + "\">Reset Password</a></p>" +
                "<p>This token will expire in 30 minutes.</p>";

        sendEmail(toEmail, "Reset Your CBT Engine Password", content);
    }

    public void sendVerificationEmail(String toEmail, String token) {
        String verifyUrl = frontendUrl + "/verify-email?token=" + token;
        String content = "<h3>Verify Your Email Address</h3>" +
                "<p>Thank you for registering. Please click the link below to activate your candidate account:</p>" +
                "<p><a href=\"" + verifyUrl + "\">Verify Email</a></p>";

        sendEmail(toEmail, "Verify Your CBT Engine Account", content);
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom("noreply@cbt-engine.org");

            mailSender.send(message);
            log.info("Sent email to: {}, Subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
