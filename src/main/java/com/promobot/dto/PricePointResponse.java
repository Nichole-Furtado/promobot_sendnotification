package com.promobot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PricePointResponse(LocalDateTime capturedAt, BigDecimal price) {}
