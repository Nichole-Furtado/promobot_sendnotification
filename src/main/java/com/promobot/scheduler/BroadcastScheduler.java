package com.promobot.scheduler;

import com.promobot.service.ProductBroadcasterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Slf4j
@Component
@RequiredArgsConstructor
public class BroadcastScheduler {

    @Value("${promobot.broadcaster.enabled}")
    private boolean enabled;

    @Value("${promobot.broadcaster.cron}")
    private String cron;

    private final ProductBroadcasterService broadcaster;

    @Scheduled(cron = "${promobot.broadcaster.cron}", zone = "America/Sao_Paulo")
    public void run() {
        if (!enabled) {
            log.debug("Broadcaster desabilitado via configuracao");
            return;
        }
        log.info("Broadcaster disparado - enviando proximo produto da rotacao");
        broadcaster.broadcastNext();
    }

    public LocalDateTime computeNextRun() {
        try {
            return CronExpression.parse(cron).next(LocalDateTime.now(ZoneId.of("America/Sao_Paulo")));
        } catch (Exception e) {
            return null;
        }
    }
}
