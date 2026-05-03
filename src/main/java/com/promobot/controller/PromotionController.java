package com.promobot.controller;

import com.promobot.dto.PromotionResponse;
import com.promobot.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionRepository promotionRepo;

    @GetMapping
    public List<PromotionResponse> listRecent() {
        return promotionRepo.findTop20ByOrderByDetectedAtDesc()
            .stream().map(PromotionResponse::from).toList();
    }
}
