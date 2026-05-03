package com.promobot.dto;

import com.promobot.entity.Product;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
    Long id,
    String asin,
    String title,
    String niche,
    BigDecimal targetDiscountPct,
    Boolean active,
    LocalDateTime createdAt
) {
    public static ProductResponse from(Product p) {
        return new ProductResponse(
            p.getId(), p.getAsin(), p.getTitle(),
            p.getNiche(), p.getTargetDiscountPct(),
            p.getActive(), p.getCreatedAt()
        );
    }
}
