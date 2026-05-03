package com.promobot.repository;

import com.promobot.entity.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChannelRepository extends JpaRepository<Channel, Long> {
    List<Channel> findByActiveTrue();
    long countByActiveTrue();
}
