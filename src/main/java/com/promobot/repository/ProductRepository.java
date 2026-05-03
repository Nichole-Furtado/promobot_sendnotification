package com.promobot.repository;

import com.promobot.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrue();
    long countByActiveTrue();
    boolean existsByAsin(String asin);

    /**
     * Retorna produtos ativos ordenados por lastNotifiedAt ascendente
     * (nulos primeiro = nunca enviados). Usado pelo broadcaster rotativo.
     */
    @Query("select p from Product p where p.active = true " +
           "order by case when p.lastNotifiedAt is null then 0 else 1 end, p.lastNotifiedAt asc")
    List<Product> findActiveOrderByLastNotified(Pageable pageable);
}
