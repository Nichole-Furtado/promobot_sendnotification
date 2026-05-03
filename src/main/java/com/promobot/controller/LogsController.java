package com.promobot.controller;

import com.promobot.service.LogCaptureService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogsController {

    private final LogCaptureService logCapture;

    @GetMapping
    public List<LogCaptureService.LogEntry> recent(
        @RequestParam(defaultValue = "200") int limit
    ) {
        int safe = Math.min(Math.max(limit, 1), 500);
        return logCapture.snapshot(safe);
    }
}
