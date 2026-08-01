package com.exam.platform.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
public class TelegramNotifierService {

    @Value("${telegram.bot.token:}")
    private String botToken;

    @Value("${telegram.admin.chat-id:}")
    private String adminChatId;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendPaymentClaimNotification(
            String studentName,
            String studentEmail,
            int credits,
            BigDecimal amount,
            String orderReference,
            String utr
    ) {
        if (botToken == null || botToken.isBlank() || adminChatId == null || adminChatId.isBlank()) {
            log.info("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured.");
            return;
        }

        try {
            String message = String.format(
                "🚨 <b>NEW UPI PAYMENT CLAIM SUBMITTED</b>\n\n" +
                "👤 <b>Student:</b> %s (%s)\n" +
                "🪙 <b>Credits Claimed:</b> %d Credits\n" +
                "💰 <b>Amount Claimed:</b> ₹%.2f INR\n" +
                "🔖 <b>Order Ref (UPI Note):</b> <code>%s</code>\n" +
                "🔢 <b>UTR Reference:</b> <code>%s</code>\n\n" +
                "✅ Please verify in Admin Panel before approving.",
                escapeHtml(studentName),
                escapeHtml(studentEmail),
                credits,
                amount,
                escapeHtml(orderReference),
                utr != null && !utr.isBlank() ? escapeHtml(utr) : "Not Provided"
            );

            String url = String.format("https://api.telegram.org/bot%s/sendMessage", botToken.trim());
            Map<String, Object> request = Map.of(
                "chat_id", adminChatId.trim(),
                "text", message,
                "parse_mode", "HTML"
            );

            restTemplate.postForObject(url, request, String.class);
            log.info("Telegram notification successfully sent for order ref {}", orderReference);
        } catch (Exception e) {
            log.warn("Failed to send Telegram notification for order ref {}: {}", orderReference, e.getMessage());
        }
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
    }
}
