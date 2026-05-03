package com.promobot.dto;

import com.promobot.entity.Promotion;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionResponse(
    Long id,
    Long productId,
    String productTitle,
    String asin,
    BigDecimal currentPrice,
    BigDecimal previousPrice,
    BigDecimal discountPct,
    LocalDateTime detectedAt,
    Boolean notified
) {
    public static PromotionResponse from(Promotion p) {
        return new PromotionResponse(
            p.getId(),
            p.getProduct().getId(),
            p.getProduct().getTitle(),
            p.getProduct().getAsin(),
            p.getCurrentPrice(),
            p.getPreviousPrice(),
            p.getDiscountPct(),
            p.getDetectedAt(),
            p.getNotified()
        );
    }
}
