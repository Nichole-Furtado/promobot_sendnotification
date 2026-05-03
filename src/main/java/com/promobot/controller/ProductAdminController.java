package com.promobot.controller;

import com.promobot.dto.CycleResult;
import com.promobot.dto.DiscoveryRequest;
import com.promobot.dto.DiscoveryResult;
import com.promobot.dto.PricePointResponse;
import com.promobot.dto.ProductRequest;
import com.promobot.dto.ProductResponse;
import com.promobot.entity.Product;
import com.promobot.repository.PriceHistoryRepository;
import com.promobot.repository.ProductRepository;
import com.promobot.scheduler.PromotionScheduler;
import com.promobot.service.AmazonDiscoveryService;
import com.promobot.service.PromotionDetectorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductAdminController {

    private final ProductRepository productRepo;
    private final PriceHistoryRepository priceHistoryRepo;
    private final PromotionDetectorService detectorService;
    private final PromotionScheduler scheduler;
    private final AmazonDiscoveryService discoveryService;

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable Long id) {
        return productRepo.findById(id)
            .map(p -> ResponseEntity.ok(ProductResponse.from(p)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/price-history")
    public ResponseEntity<List<PricePointResponse>> priceHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "30") int days) {
        return productRepo.findById(id)
            .map(product -> {
                int safeDays = Math.max(1, Math.min(days, 365));
                LocalDateTime since = LocalDateTime.now().minusDays(safeDays);
                List<PricePointResponse> points = priceHistoryRepo
                    .findByProductAndCapturedAtAfterOrderByCapturedAtAsc(product, since)
                    .stream()
                    .map(h -> new PricePointResponse(h.getCapturedAt(), h.getPrice()))
                    .toList();
                return ResponseEntity.ok(points);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<ProductResponse> listAll() {
        return productRepo.findAll().stream()
            .map(ProductResponse::from)
            .toList();
    }

    @PostMapping
    public ResponseEntity<ProductResponse> addProduct(@Valid @RequestBody ProductRequest req) {
        Product product = Product.builder()
            .asin(req.asin())
            .title(req.title())
            .niche(req.niche())
            .targetDiscountPct(req.targetDiscountPct())
            .active(true)
            .build();
        Product saved = productRepo.save(product);
        log.info("Produto cadastrado: ASIN {}", saved.getAsin());
        return ResponseEntity.status(201).body(ProductResponse.from(saved));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ProductResponse> toggleActive(@PathVariable Long id) {
        return productRepo.findById(id)
            .map(p -> {
                p.setActive(!p.getActive());
                Product updated = productRepo.save(p);
                return ResponseEntity.ok(ProductResponse.from(updated));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeProduct(@PathVariable Long id) {
        if (!productRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/run-now")
    public ResponseEntity<CycleResult> runNow() {
        log.info("Execucao manual do ciclo de deteccao disparada via API");
        CycleResult result = detectorService.runCycle();
        scheduler.recordManualRun(result);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/discover")
    public ResponseEntity<DiscoveryResult> discover(@Valid @RequestBody DiscoveryRequest req) {
        int limit = req.limit() != null ? req.limit() : 10;
        BigDecimal targetPct = req.targetDiscountPct() != null
            ? req.targetDiscountPct() : new BigDecimal("10.00");
        String niche = req.niche() != null ? req.niche() : "Outros";

        log.info("Discovery solicitado: query='{}' limit={}", req.query(), limit);
        List<AmazonDiscoveryService.DiscoveredProduct> found = discoveryService.discover(req.query(), limit);

        List<String> created = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        for (AmazonDiscoveryService.DiscoveredProduct p : found) {
            if (productRepo.existsByAsin(p.asin())) {
                skipped.add(p.asin());
                continue;
            }
            productRepo.save(Product.builder()
                .asin(p.asin())
                .title(p.title())
                .niche(niche)
                .targetDiscountPct(targetPct)
                .active(true)
                .build());
            created.add(p.asin());
        }

        log.info("Discovery concluido: {} encontrados, {} criados, {} duplicados",
            found.size(), created.size(), skipped.size());
        return ResponseEntity.ok(new DiscoveryResult(
            req.query(), found.size(), created.size(), skipped.size(), created, skipped));
    }
}
