package com.promobot.repository;

import com.promobot.entity.Promotion;
import com.promobot.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByNotifiedFalse();
    boolean existsByProductAndNotifiedFalse(Product product);
    long countByNotifiedFalse();
    List<Promotion> findTop20ByOrderByDetectedAtDesc();

    @Query("select max(p.discountPct) from Promotion p")
    BigDecimal findMaxDiscountPct();
}
