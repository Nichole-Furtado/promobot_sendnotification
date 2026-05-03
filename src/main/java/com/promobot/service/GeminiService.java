package com.promobot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private static final String BASE_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/";

    @Value("${promobot.gemini.api-key}")
    private String apiKey;

    @Value("${promobot.gemini.model}")
    private String model;

    @Value("${promobot.amazon.associate-tag}")
    private String associateTag;

    private final RestClient restClient;

    public String generatePromoMessage(String productTitle,
                                       BigDecimal previousPrice,
                                       BigDecimal currentPrice,
                                       BigDecimal discountPct,
                                       String asin) {
        String affiliateUrl = buildAffiliateUrl(asin);
        String prompt = buildPrompt(productTitle, previousPrice, currentPrice, discountPct, affiliateUrl);

        Map<String, Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
            )
        );

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                .uri(BASE_URL + model + ":generateContent?key=" + apiKey)
                .body(body)
                .retrieve()
                .body(Map.class);

            return extractText(response);
        } catch (Exception e) {
            log.error("Erro ao chamar Gemini API: {}", e.getMessage());
            return buildFallbackMessage(productTitle, previousPrice, currentPrice, discountPct, affiliateUrl);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        try {
            var candidates = (List<Map<String, Object>>) response.get("candidates");
            var content = (Map<String, Object>) candidates.get(0).get("content");
            var parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.warn("Nao foi possivel extrair texto da resposta Gemini: {}", e.getMessage());
            return null;
        }
    }

    private String buildPrompt(String title, BigDecimal prev, BigDecimal curr,
                                BigDecimal pct, String url) {
        return String.format(
            "Voce e um divulgador de promocoes Amazon estilo Telegram brasileiro - tom URGENTE, " +
            "EXAGERADO, com MUITOS emojis e CAIXA ALTA em palavras-chave. " +
            "Crie uma mensagem promocional CURTA (max 8 linhas) seguindo EXATAMENTE este formato:\n\n" +
            "[CHAMADA EM CAIXA ALTA com emoji do nicho do produto]\n\n" +
            "🛍️ [Titulo do produto resumido]\n\n" +
            "De: R$ %.2f\n" +
            "🔥 Por: R$ %.2f 🚨🚨\n\n" +
            "🔗 Compre aqui: %s\n\n" +
            "[Frase de urgencia em CAIXA ALTA com emojis tipo 'PEGA LOGO ANTES QUE ACABA' " +
            "ou 'TA DE GRACA' ou 'CORRE QUE TA VOANDO' - varie conforme o desconto] %.0f%% OFF! 🚨🚨😱\n\n" +
            "Dados:\n" +
            "- Produto: %s\n" +
            "- Desconto: %.0f%% OFF\n\n" +
            "REGRAS: NAO use markdown (sem ** ou __). Use <b>tag HTML</b> APENAS na chamada e na frase final. " +
            "Use emojis abundantes (3-6 por linha de destaque). Seja descontraido, energetico, " +
            "como um stories de oferta no Instagram. Responda APENAS a mensagem final, sem explicar.",
            prev, curr, url, pct, title, pct
        );
    }

    private String buildFallbackMessage(String title, BigDecimal prev, BigDecimal curr,
                                         BigDecimal pct, String url) {
        return String.format(
            "🚨 OFERTA RELÂMPAGO! 🚨\n\n" +
            "🛍️ %s\n\n" +
            "De: R$ %.2f\n" +
            "🔥 Por: R$ %.2f 🚨🚨\n\n" +
            "🔗 Compre aqui: %s\n\n" +
            "<b>CORRE QUE TA VOANDO!</b> %.0f%% OFF! 🚨🚨😱😱",
            title, prev, curr, url, pct
        );
    }

    private String buildAffiliateUrl(String asin) {
        return "https://www.amazon.com.br/dp/" + asin + "/?tag=" + associateTag;
    }
}
