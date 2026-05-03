package com.promobot.dto;

import java.util.List;

public record DiscoveryResult(
    String query,
    int found,
    int created,
    int skipped,
    List<String> createdAsins,
    List<String> skippedAsins
) {}
