package com.promobot.service;

import com.promobot.entity.Channel;
import com.promobot.entity.Product;
import com.promobot.repository.ChannelRepository;
import com.promobot.repository.ProductRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Divulgador rotativo: envia 1 produto por execucao para todos os canais
 * ativos. Escolhe sempre o produto ativo com lastNotifiedAt mais antigo
 * (nulos primeiro), garantindo rotacao sem repeticao ate todos terem ido.
 *
 * Esse fluxo NAO depende de queda real de preco (diferente do
 * PromotionDetectorService). Usa o preco atual como "Por" e estima um
 * preco "De" inflado em 30% para compor a mensagem promocional.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductBroadcasterService {

    private static final BigDecimal FAKE_DISCOUNT_FACTOR = new BigDecimal("1.30");
    private static final BigDecimal FAKE_DISCOUNT_PCT = new BigDecimal("23.08");

    private final ProductRepository productRepo;
    private final ChannelRepository channelRepo;
    private final AmazonScraperService scraper;
    private final GeminiService geminiService;
    private final TelegramService telegramService;

    public record BroadcastResult(boolean sent, String asin, String reason, int channelsSent) {}

    @Getter
    private volatile LocalDateTime lastBroadcastAt;
    @Getter
    private volatile BroadcastResult lastBroadcastResult;

    @Transactional
    public BroadcastResult broadcastNext() {
        List<Channel> channels = channelRepo.findByActiveTrue();
        if (channels.isEmpty()) {
            return record(new BroadcastResult(false, null, "nenhum canal ativo", 0));
        }

        // Pega o proximo produto na rotacao (mais antigo no lastNotifiedAt; nulos primeiro)
        List<Product> next = productRepo.findActiveOrderByLastNotified(PageRequest.of(0, 1));
        if (next.isEmpty()) {
            return record(new BroadcastResult(false, null, "nenhum produto ativo", 0));
        }
        Product product = next.get(0);

        Optional<AmazonScraperService.ProductSnapshot> snapOpt = scraper.fetchSnapshot(product.getAsin());
        if (snapOpt.isEmpty()) {
            // Mesmo sem snapshot, marca para rotacionar e nao travar a fila no mesmo produto
            product.setLastNotifiedAt(LocalDateTime.now());
            productRepo.save(product);
            return record(new BroadcastResult(false, product.getAsin(),
                "scraper falhou (Amazon bloqueou ou produto indisponivel)", 0));
        }
        AmazonScraperService.ProductSnapshot snap = snapOpt.get();

        BigDecimal currentPrice = snap.price();
        BigDecimal previousPrice = currentPrice.multiply(FAKE_DISCOUNT_FACTOR)
            .setScale(2, java.math.RoundingMode.HALF_UP);

        String message = geminiService.generatePromoMessage(
            product.getTitle(), previousPrice, currentPrice, FAKE_DISCOUNT_PCT, product.getAsin());

        int sent = 0;
        for (Channel ch : channels) {
            if (!"telegram".equalsIgnoreCase(ch.getType())) continue;
            try {
                if (snap.imageUrl() != null) {
                    telegramService.sendPhoto(ch.getIdentifier(), snap.imageUrl(), message);
                } else {
                    telegramService.sendMessage(ch.getIdentifier(), message);
                }
                sent++;
            } catch (Exception e) {
                log.error("Broadcaster falhou no canal {}: {}", ch.getIdentifier(), e.getMessage());
            }
        }

        // SEMPRE marca como notificado para rotacionar (mesmo se 0 enviados, evita loop)
        product.setLastNotifiedAt(LocalDateTime.now());
        productRepo.save(product);

        log.info("Broadcaster: ASIN {} enviado para {}/{} canais", product.getAsin(), sent, channels.size());
        return record(new BroadcastResult(sent > 0, product.getAsin(),
            sent > 0 ? "ok" : "todos canais falharam", sent));
    }

    private BroadcastResult record(BroadcastResult r) {
        this.lastBroadcastAt = LocalDateTime.now();
        this.lastBroadcastResult = r;
        return r;
    }
}
