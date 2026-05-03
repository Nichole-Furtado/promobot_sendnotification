package com.promobot.controller;

import com.promobot.entity.Channel;
import com.promobot.entity.Product;
import com.promobot.repository.ChannelRepository;
import com.promobot.repository.ProductRepository;
import com.promobot.service.AmazonScraperService;
import com.promobot.service.GeminiService;
import com.promobot.service.ProductBroadcasterService;
import com.promobot.service.TelegramService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Endpoints para validar manualmente o pipeline de notificacao
 * (Amazon -> IA -> Telegram com foto) sem esperar o ciclo do scheduler
 * nem precisar de uma queda real de preco.
 */
@Slf4j
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestNotificationController {

    private final ProductRepository productRepo;
    private final ChannelRepository channelRepo;
    private final AmazonScraperService scraper;
    private final GeminiService geminiService;
    private final TelegramService telegramService;
    private final ProductBroadcasterService broadcaster;

    /**
     * Dispara um envio simulado para o produto informado.
     * Busca dados reais (preco atual + imagem) na Amazon, gera mensagem com IA
     * e envia foto+caption ao Telegram. Usa um precoAnterior fictcio (atual * 1.4)
     * para simular -29%.
     */
    @PostMapping("/notify/{productId}")
    public ResponseEntity<Map<String, Object>> testNotify(@PathVariable Long productId) {
        Optional<Product> productOpt = productRepo.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "produto nao encontrado"));
        }
        Product product = productOpt.get();

        Optional<AmazonScraperService.ProductSnapshot> snapOpt = scraper.fetchSnapshot(product.getAsin());
        if (snapOpt.isEmpty()) {
            return ResponseEntity.status(502).body(Map.of(
                "error", "scraper nao retornou snapshot (Amazon pode estar bloqueando)",
                "asin", product.getAsin()));
        }
        AmazonScraperService.ProductSnapshot snap = snapOpt.get();

        BigDecimal currentPrice = snap.price();
        BigDecimal previousPrice = currentPrice.multiply(new BigDecimal("1.40"));
        BigDecimal discountPct = new BigDecimal("28.57");

        String message = geminiService.generatePromoMessage(
            product.getTitle(), previousPrice, currentPrice, discountPct, product.getAsin());

        List<Channel> channels = channelRepo.findByActiveTrue();
        if (channels.isEmpty()) {
            return ResponseEntity.status(412).body(Map.of(
                "error", "nenhum canal Telegram ativo cadastrado",
                "currentPrice", currentPrice,
                "imageUrl", String.valueOf(snap.imageUrl()),
                "generatedMessage", message));
        }

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
                log.error("Falha ao enviar teste para {}: {}", ch.getIdentifier(), e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
            "asin", product.getAsin(),
            "title", product.getTitle(),
            "currentPrice", currentPrice,
            "fakePreviousPrice", previousPrice,
            "discountPct", discountPct,
            "imageUrl", String.valueOf(snap.imageUrl()),
            "generatedMessage", message,
            "channelsSent", sent,
            "channelsTotal", channels.size()
        ));
    }

    /** Dispara manualmente o broadcaster rotativo (envia o proximo produto da fila). */
    @PostMapping("/broadcast-next")
    public ResponseEntity<ProductBroadcasterService.BroadcastResult> broadcastNext() {
        return ResponseEntity.ok(broadcaster.broadcastNext());
    }
}
