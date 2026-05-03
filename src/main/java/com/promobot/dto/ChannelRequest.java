package com.promobot.dto;

import jakarta.validation.constraints.NotBlank;

public record ChannelRequest(
    @NotBlank String type,
    @NotBlank String identifier
) {}
