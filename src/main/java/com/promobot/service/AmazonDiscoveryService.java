package com.promobot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Descobre produtos da Amazon BR por termo de busca.
 * Faz scraping da SERP e extrai ASIN + titulo.
 * AVISO: MVP. Producao deve usar PA-API v5.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AmazonDiscoveryService {

    private static final String SEARCH_URL = "https://www.amazon.com.br/s?k=";
    private static final int TIMEOUT_MS = 20_000;
    private static final String USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    public record DiscoveredProduct(String asin, String title) {}

    public List<DiscoveredProduct> discover(String query, int limit) {
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            Document doc = Jsoup.connect(SEARCH_URL + encoded)
                .userAgent(USER_AGENT)
                .header("Accept-Language", "pt-BR,pt;q=0.9,en;q=0.8")
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .timeout(TIMEOUT_MS)
                .get();

            // Mantem ordem e remove duplicatas por ASIN
            Map<String, DiscoveredProduct> found = new LinkedHashMap<>();
            Elements items = doc.select("div[data-component-type=s-search-result][data-asin]");

            for (Element item : items) {
                if (found.size() >= limit) break;
                String asin = item.attr("data-asin");
                if (asin == null || asin.length() != 10 || asin.isBlank()) continue;
                if (found.containsKey(asin)) continue;

                String title = extractTitle(item);
                if (title == null || title.isBlank()) continue;

                // Filtra resultados patrocinados/sponsored se o item esta marcado
                if (item.selectFirst("span:matchesOwn((?i)patrocinado|sponsored)") != null) {
                    continue;
                }

                found.put(asin, new DiscoveredProduct(asin, title));
            }

            log.info("Discovery query='{}' -> {} produtos encontrados", query, found.size());
            return new ArrayList<>(found.values());
        } catch (Exception e) {
            log.error("Falha no discovery '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    private String extractTitle(Element item) {
        // Seletor principal usado na SERP atual
        Element h2 = item.selectFirst("h2 a span");
        if (h2 != null) {
            String t = h2.text().trim();
            if (!t.isEmpty()) return truncate(t);
        }
        // Fallback
        Element alt = item.selectFirst("h2 span");
        if (alt != null) {
            String t = alt.text().trim();
            if (!t.isEmpty()) return truncate(t);
        }
        return null;
    }

    private String truncate(String s) {
        return s.length() > 250 ? s.substring(0, 250) : s;
    }
}
