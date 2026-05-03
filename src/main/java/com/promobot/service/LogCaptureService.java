package com.promobot.service;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import jakarta.annotation.PostConstruct;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Service
public class LogCaptureService {

    private static final int CAPACITY = 500;
    private static final DateTimeFormatter TS = DateTimeFormatter
        .ofPattern("HH:mm:ss")
        .withZone(ZoneId.systemDefault());

    private final Deque<LogEntry> buffer = new ArrayDeque<>(CAPACITY);

    public record LogEntry(String time, String level, String logger, String message) {}

    @PostConstruct
    public void register() {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        AppenderBase<ILoggingEvent> appender = new AppenderBase<>() {
            @Override
            protected void append(ILoggingEvent event) {
                String loggerName = event.getLoggerName();
                int dot = loggerName.lastIndexOf('.');
                String shortLogger = dot >= 0 ? loggerName.substring(dot + 1) : loggerName;
                LogEntry entry = new LogEntry(
                    TS.format(Instant.ofEpochMilli(event.getTimeStamp())),
                    event.getLevel().toString(),
                    shortLogger,
                    event.getFormattedMessage()
                );
                synchronized (buffer) {
                    if (buffer.size() >= CAPACITY) buffer.pollFirst();
                    buffer.addLast(entry);
                }
            }
        };
        appender.setName("InMemoryRingBuffer");
        appender.setContext(root.getLoggerContext());
        appender.start();
        root.addAppender(appender);
    }

    public List<LogEntry> snapshot(int limit) {
        synchronized (buffer) {
            List<LogEntry> all = new ArrayList<>(buffer);
            int from = Math.max(0, all.size() - limit);
            return all.subList(from, all.size());
        }
    }
}
