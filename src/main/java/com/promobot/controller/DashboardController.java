package com.promobot.controller;

import com.promobot.dto.CycleResult;
import com.promobot.dto.DashboardStats;
import com.promobot.repository.*;
import com.promobot.scheduler.PromotionScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ProductRepository productRepo;
    private final PromotionRepository promotionRepo;
    private final NotificationRepository notificationRepo;
    private final ChannelRepository channelRepo;
    private final PromotionScheduler promotionScheduler;

    @GetMapping
    public DashboardStats getStats() {
        Runtime rt = Runtime.getRuntime();
        long usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        long maxMb = rt.maxMemory() / (1024 * 1024);
        long uptimeSec = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        CycleResult last = promotionScheduler.getLastRunResult();

        return new DashboardStats(
            productRepo.count(),
            productRepo.countByActiveTrue(),
            promotionRepo.count(),
            promotionRepo.countByNotifiedFalse(),
            notificationRepo.count(),
            channelRepo.countByActiveTrue(),
            promotionScheduler.getLastRunAt(),
            promotionScheduler.computeNextRun(),
            last != null ? last.durationMs() : null,
            last != null ? last.productsChecked() : null,
            last != null ? last.promotionsDetected() : null,
            promotionRepo.findMaxDiscountPct(),
            uptimeSec,
            usedMb,
            maxMb,
            "1.0.0"
        );
    }
}
