package com.promobot.dto;

public record CycleResult(
    int productsChecked,
    int promotionsDetected,
    int errors,
    long durationMs
) {}
