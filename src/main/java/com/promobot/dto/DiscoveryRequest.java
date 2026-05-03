package com.promobot.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record DiscoveryRequest(
    @NotBlank String query,
    String niche,
    @Min(1) @Max(50) Integer limit,
    BigDecimal targetDiscountPct
) {}
