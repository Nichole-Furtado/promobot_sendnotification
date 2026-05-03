package com.promobot.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
    @NotBlank @Size(min = 10, max = 10) String asin,
    @NotBlank @Size(max = 500) String title,
    @Size(max = 100) String niche,
    @DecimalMin("1.00") BigDecimal targetDiscountPct
) {}
