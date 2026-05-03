package com.promobot.service;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Optional;

/**
 * Busca dados atuais de produto Amazon via scraping.
 * AVISO: solucao de MVP. Para producao, substituir por Amazon PA-API v5.
 */
@Slf4j
@Service
public class AmazonScraperService {

    private static final String PRODUCT_URL = "https://www.amazon.com.br/dp/";
    private static final int TIMEOUT_MS = 15_000;
    private static final String USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    public record ProductSnapshot(BigDecimal price, String imageUrl) {}

    /** Mantido para compatibilidade. */
    public Optional<BigDecimal> fetchCurrentPrice(String asin) {
        return fetchSnapshot(asin).map(ProductSnapshot::price);
    }

    public Optional<ProductSnapshot> fetchSnapshot(String asin) {
        try {
            Document doc = Jsoup.connect(PRODUCT_URL + asin)
                .userAgent(USER_AGENT)
                .header("Accept-Language", "pt-BR,pt;q=0.9,en;q=0.8")
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .timeout(TIMEOUT_MS)
                .get();

            Optional<BigDecimal> priceOpt = parsePrice(doc, asin);
            if (priceOpt.isEmpty()) return Optional.empty();
            String imageUrl = parseImageUrl(doc);
            return Optional.of(new ProductSnapshot(priceOpt.get(), imageUrl));
        } catch (Exception e) {
            log.warn("Falha ao buscar snapshot ASIN {}: {}", asin, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<BigDecimal> parsePrice(Document doc, String asin) {
        Element wholeEl = doc.selectFirst("span.a-price-whole");
        Element fracEl  = doc.selectFirst("span.a-price-fraction");

        if (wholeEl != null) {
            String whole = wholeEl.text().replaceAll("[^0-9]", "");
            String frac  = (fracEl != null) ? fracEl.text().replaceAll("[^0-9]", "") : "00";
            if (frac.length() == 1) frac = frac + "0";
            if (!whole.isEmpty()) {
                BigDecimal price = new BigDecimal(whole + "." + frac);
                log.debug("Preco ASIN {}: R$ {}", asin, price);
                return Optional.of(price);
            }
        }

        Element altEl = doc.selectFirst("#priceblock_ourprice, #priceblock_dealprice");
        if (altEl != null) {
            String text = altEl.text().replaceAll("[^0-9,]", "").replace(",", ".");
            try {
                return Optional.of(new BigDecimal(text));
            } catch (NumberFormatException ignored) {}
        }

        log.warn("Preco nao encontrado para ASIN {}. Produto pode estar indisponivel.", asin);
        return Optional.empty();
    }

    /**
     * Extrai a URL da imagem principal do produto.
     * Tenta varios seletores em ordem de confiabilidade.
     */
    private String parseImageUrl(Document doc) {
        // 1. landingImage (mais comum em paginas de produto)
        Element img = doc.selectFirst("#landingImage");
        if (img != null) {
            String url = bestSrc(img);
            if (url != null) return url;
        }
        // 2. imgBlkFront (livros)
        img = doc.selectFirst("#imgBlkFront");
        if (img != null) {
            String url = bestSrc(img);
            if (url != null) return url;
        }
        // 3. og:image meta
        Element meta = doc.selectFirst("meta[property=og:image]");
        if (meta != null) {
            String url = meta.attr("content");
            if (!url.isBlank()) return url;
        }
        // 4. qualquer img dentro do bloco principal
        img = doc.selectFirst("#main-image-container img, #imageBlock img");
        if (img != null) return bestSrc(img);
        return null;
    }

    /** Tenta src mais alta resolucao disponivel via data-old-hires, data-a-dynamic-image, src. */
    private String bestSrc(Element img) {
        String hires = img.attr("data-old-hires");
        if (hires != null && !hires.isBlank()) return hires;

        // data-a-dynamic-image tem JSON {"url":[w,h], ...}; pega a primeira chave
        String dyn = img.attr("data-a-dynamic-image");
        if (dyn != null && !dyn.isBlank()) {
            int q1 = dyn.indexOf("\"");
            int q2 = (q1 >= 0) ? dyn.indexOf("\"", q1 + 1) : -1;
            if (q1 >= 0 && q2 > q1) {
                return dyn.substring(q1 + 1, q2);
            }
        }

        String src = img.attr("src");
        return (src != null && !src.isBlank()) ? src : null;
    }
}
