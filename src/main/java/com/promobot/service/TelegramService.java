package com.promobot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramService {

    private static final String BASE_URL = "https://api.telegram.org/bot";
    /** Telegram limita caption de sendPhoto a 1024 caracteres. */
    private static final int CAPTION_MAX = 1024;

    @Value("${promobot.telegram.bot-token}")
    private String botToken;

    @Value("${promobot.telegram.chat-id}")
    private String defaultChatId;

    private final RestClient restClient;

    /** Envia para chat_id especifico (do canal cadastrado). */
    public String sendMessage(String chatId, String text) {
        return post("sendMessage", Map.of(
            "chat_id", resolveChatId(chatId),
            "text", text,
            "parse_mode", "HTML",
            "disable_web_page_preview", "false"
        ));
    }

    /** Envia foto com legenda (mensagem da IA). Cai para sendMessage se photoUrl invalido. */
    public String sendPhoto(String chatId, String photoUrl, String caption) {
        if (photoUrl == null || photoUrl.isBlank()) {
            log.debug("sendPhoto sem URL, fallback para sendMessage");
            return sendMessage(chatId, caption);
        }
        Map<String, String> body = new HashMap<>();
        body.put("chat_id", resolveChatId(chatId));
        body.put("photo", photoUrl);
        body.put("parse_mode", "HTML");
        if (caption != null && !caption.isBlank()) {
            body.put("caption", truncateCaption(caption));
        }
        try {
            return post("sendPhoto", body);
        } catch (RuntimeException e) {
            // Telegram pode rejeitar a foto (URL inacessivel/bloqueada). Fallback texto.
            log.warn("sendPhoto falhou ({}), enviando como texto. Photo: {}", e.getMessage(), photoUrl);
            return sendMessage(chatId, caption);
        }
    }

    /** Compatibilidade: envia ao chat_id default da config. */
    public String sendMessage(String text) {
        return sendMessage(defaultChatId, text);
    }

    private String resolveChatId(String chatId) {
        return (chatId == null || chatId.isBlank()) ? defaultChatId : chatId;
    }

    private String truncateCaption(String s) {
        if (s.length() <= CAPTION_MAX) return s;
        return s.substring(0, CAPTION_MAX - 3) + "...";
    }

    private String post(String endpoint, Map<String, String> body) {
        try {
            var response = restClient.post()
                .uri(BASE_URL + botToken + "/" + endpoint)
                .body(body)
                .retrieve()
                .toEntity(String.class);
            log.info("Telegram {} OK status={} chat={}",
                endpoint, response.getStatusCode(), body.get("chat_id"));
            return response.getBody();
        } catch (Exception e) {
            log.error("Falha Telegram {}: {}", endpoint, e.getMessage());
            throw new RuntimeException("Erro Telegram " + endpoint, e);
        }
    }
}
