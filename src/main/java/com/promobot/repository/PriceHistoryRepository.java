package com.promobot.repository;

import com.promobot.entity.PriceHistory;
import com.promobot.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    Optional<PriceHistory> findFirstByProductOrderByCapturedAtDesc(Product product);

    List<PriceHistory> findByProductAndCapturedAtAfterOrderByCapturedAtAsc(Product product, LocalDateTime since);
}
