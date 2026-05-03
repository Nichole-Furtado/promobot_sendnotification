package com.promobot.controller;

import com.promobot.dto.ChannelRequest;
import com.promobot.dto.ChannelResponse;
import com.promobot.entity.Channel;
import com.promobot.repository.ChannelRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelAdminController {

    private final ChannelRepository channelRepo;

    @GetMapping
    public List<ChannelResponse> listAll() {
        return channelRepo.findAll().stream().map(ChannelResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<ChannelResponse> addChannel(@Valid @RequestBody ChannelRequest req) {
        Channel channel = Channel.builder()
            .type(req.type())
            .identifier(req.identifier())
            .active(true)
            .build();
        return ResponseEntity.status(201).body(ChannelResponse.from(channelRepo.save(channel)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ChannelResponse> toggleActive(@PathVariable Long id) {
        return channelRepo.findById(id)
            .map(c -> {
                c.setActive(!c.getActive());
                return ResponseEntity.ok(ChannelResponse.from(channelRepo.save(c)));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeChannel(@PathVariable Long id) {
        if (!channelRepo.existsById(id)) return ResponseEntity.notFound().build();
        channelRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
