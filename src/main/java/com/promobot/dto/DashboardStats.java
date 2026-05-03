package com.promobot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DashboardStats(
    long totalProducts,
    long activeProducts,
    long totalPromotions,
    long pendingPromotions,
    long totalNotifications,
    long activeChannels,
    LocalDateTime lastRunAt,
    LocalDateTime nextRunAt,
    Long lastRunDurationMs,
    Integer lastRunProductsChecked,
    Integer lastRunPromotionsDetected,
    BigDecimal bestDiscountEverPct,
    long uptimeSeconds,
    long jvmMemoryUsedMb,
    long jvmMemoryMaxMb,
    String appVersion
) {}
