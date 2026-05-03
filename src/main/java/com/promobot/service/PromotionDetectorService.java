package com.promobot.service;

import com.promobot.dto.CycleResult;
import com.promobot.entity.*;
import com.promobot.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionDetectorService {

    private final ProductRepository productRepo;
    private final PriceHistoryRepository priceHistoryRepo;
    private final PromotionRepository promotionRepo;
    private final ChannelRepository channelRepo;
    private final NotificationRepository notificationRepo;
    private final AmazonScraperService amazonScraper;
    private final GeminiService geminiService;
    private final TelegramService telegramService;

    @Transactional
    public CycleResult runCycle() {
        long start = System.currentTimeMillis();
        long promotionsBefore = promotionRepo.count();
        List<Product> products = productRepo.findByActiveTrue();
        log.info("Iniciando ciclo: {} produtos ativos", products.size());

        AtomicInteger errors = new AtomicInteger();
        for (Product product : products) {
            try {
                processProduct(product);
            } catch (Exception e) {
                errors.incrementAndGet();
                log.error("Erro ao processar produto ASIN {}: {}", product.getAsin(), e.getMessage());
            }
        }

        long durationMs = System.currentTimeMillis() - start;
        int detected = (int) (promotionRepo.count() - promotionsBefore);
        log.info("Ciclo concluido em {} ms - {} promocoes novas, {} erros", durationMs, detected, errors.get());
        return new CycleResult(products.size(), detected, errors.get(), durationMs);
    }

    private void processProduct(Product product) {
        Optional<AmazonScraperService.ProductSnapshot> snapOpt = amazonScraper.fetchSnapshot(product.getAsin());
        if (snapOpt.isEmpty()) {
            log.debug("Snapshot nao obtido para ASIN {}, pulando", product.getAsin());
            return;
        }
        AmazonScraperService.ProductSnapshot snap = snapOpt.get();
        BigDecimal currentPrice = snap.price();

        // FIX: busca historico anterior ANTES de salvar o novo (senao retorna ele mesmo).
        Optional<PriceHistory> previousHistoryOpt = priceHistoryRepo
            .findFirstByProductOrderByCapturedAtDesc(product);

        // Salva o novo historico depois da leitura
        priceHistoryRepo.save(PriceHistory.builder()
            .product(product)
            .price(currentPrice)
            .build());

        if (previousHistoryOpt.isEmpty()) {
            log.debug("Sem historico anterior para ASIN {} (primeira captura)", product.getAsin());
            return;
        }

        BigDecimal previousPrice = previousHistoryOpt.get().getPrice();
        if (previousPrice.compareTo(BigDecimal.ZERO) <= 0) return;

        BigDecimal discountPct = previousPrice.subtract(currentPrice)
            .divide(previousPrice, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .setScale(2, RoundingMode.HALF_UP);

        log.info("ASIN {} - anterior: R${} | atual: R${} | desconto: {}%",
            product.getAsin(), previousPrice, currentPrice, discountPct);

        boolean isPromotion = discountPct.compareTo(product.getTargetDiscountPct()) >= 0;
        boolean alreadyPending = promotionRepo.existsByProductAndNotifiedFalse(product);

        if (isPromotion && !alreadyPending) {
            notifyPromotion(product, currentPrice, previousPrice, discountPct, snap.imageUrl());
        }
    }

    private void notifyPromotion(Product product, BigDecimal currentPrice,
                                  BigDecimal previousPrice, BigDecimal discountPct,
                                  String imageUrl) {
        Promotion promotion = promotionRepo.save(Promotion.builder()
            .product(product)
            .currentPrice(currentPrice)
            .previousPrice(previousPrice)
            .discountPct(discountPct)
            .notified(false)
            .build());

        List<Channel> channels = channelRepo.findByActiveTrue();
        if (channels.isEmpty()) {
            log.warn("Nenhum canal ativo cadastrado. Promocao registrada mas nao enviada.");
            return;
        }

        String message = geminiService.generatePromoMessage(
            product.getTitle(), previousPrice, currentPrice, discountPct, product.getAsin()
        );
        if (message == null || message.isBlank()) {
            log.warn("IA nao gerou mensagem para ASIN {}. Usando fallback.", product.getAsin());
            message = String.format(
                "Promocao!\n%s\nDe R$ %.2f por R$ %.2f (%.0f%% OFF)\nhttps://www.amazon.com.br/dp/%s",
                product.getTitle(), previousPrice, currentPrice, discountPct, product.getAsin()
            );
        }

        int sent = 0;
        for (Channel channel : channels) {
            if (sendToChannel(channel, promotion, message, imageUrl)) sent++;
        }

        if (sent > 0) {
            promotion.setNotified(true);
            promotionRepo.save(promotion);
        }
        log.info("Promocao ASIN {} enviada para {}/{} canais (imagem: {})",
            product.getAsin(), sent, channels.size(), imageUrl != null);
    }

    private boolean sendToChannel(Channel channel, Promotion promotion,
                                   String message, String imageUrl) {
        try {
            if (!"telegram".equalsIgnoreCase(channel.getType())) {
                log.warn("Tipo de canal nao suportado: {}", channel.getType());
                return false;
            }
            if (imageUrl != null && !imageUrl.isBlank()) {
                telegramService.sendPhoto(channel.getIdentifier(), imageUrl, message);
            } else {
                telegramService.sendMessage(channel.getIdentifier(), message);
            }
            notificationRepo.save(Notification.builder()
                .promotion(promotion)
                .channel(channel)
                .build());
            return true;
        } catch (Exception e) {
            log.error("Falha ao enviar para canal {} ({}): {}",
                channel.getType(), channel.getIdentifier(), e.getMessage());
            return false;
        }
    }
}
