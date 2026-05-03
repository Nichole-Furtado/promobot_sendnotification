package com.promobot.scheduler;

import com.promobot.dto.CycleResult;
import com.promobot.service.PromotionDetectorService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class PromotionScheduler {

    @Value("${promobot.scheduler.enabled}")
    private boolean enabled;

    @Value("${promobot.scheduler.cron}")
    private String cronExpression;

    private final PromotionDetectorService detectorService;

    @Getter
    private volatile LocalDateTime lastRunAt;

    @Getter
    private volatile CycleResult lastRunResult;

    @Scheduled(cron = "${promobot.scheduler.cron}")
    public void run() {
        if (!enabled) {
            log.debug("Scheduler desabilitado via configuracao");
            return;
        }
        log.info("Scheduler disparado - iniciando verificacao de promocoes");
        lastRunAt = LocalDateTime.now();
        lastRunResult = detectorService.runCycle();
    }

    public void recordManualRun(CycleResult result) {
        lastRunAt = LocalDateTime.now();
        lastRunResult = result;
    }

    public LocalDateTime computeNextRun() {
        try {
            CronExpression expr = CronExpression.parse(cronExpression);
            return expr.next(LocalDateTime.now());
        } catch (Exception e) {
            return null;
        }
    }
}
