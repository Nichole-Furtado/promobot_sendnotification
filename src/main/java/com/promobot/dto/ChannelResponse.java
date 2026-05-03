package com.promobot.dto;

import com.promobot.entity.Channel;
import java.time.LocalDateTime;

public record ChannelResponse(
    Long id,
    String type,
    String identifier,
    Boolean active,
    LocalDateTime createdAt
) {
    public static ChannelResponse from(Channel c) {
        return new ChannelResponse(c.getId(), c.getType(), c.getIdentifier(), c.getActive(), c.getCreatedAt());
    }
}
