package com.exam.platform.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        log.info("[EMAIL SERVICE] Generated password reset OTP for {}: {}", toEmail, token);
        String content = "<h3>Password Reset OTP</h3>" +
                "<p>Your One-Time Password (OTP) to reset your National Testing Engine password is:</p>" +
                "<h2 style=\"font-size: 24px; letter-spacing: 4px; color: #0284c7;\">" + token + "</h2>" +
                "<p>Enter this OTP code on the website to reset your password.</p>" +
                "<p>This OTP will expire in 30 minutes.</p>";

        sendEmail(toEmail, "Reset Your CBT Engine Password", content);
    }

    @Async
    public void sendVerificationEmail(String toEmail, String token) {
        log.info("[EMAIL SERVICE] Generated email verification OTP for {}: {}", toEmail, token);
        String content = "<h3>Email Verification OTP</h3>" +
                "<p>Thank you for registering. Your verification One-Time Password (OTP) is:</p>" +
                "<h2 style=\"font-size: 24px; letter-spacing: 4px; color: #0284c7;\">" + token + "</h2>" +
                "<p>Enter this code on the website to activate your account.</p>";

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
            log.error("Failed to send email to {} (MessagingException): {}", to, e.getMessage());
        } catch (Exception e) {
            // MailSendException (thrown by mailSender.send()) extends RuntimeException,
            // not MessagingException — this catches SMTP auth failures, connection errors, etc.
            log.error("Failed to send email to {} ({}): {}", to, e.getClass().getSimpleName(), e.getMessage());
        }
    }
}
