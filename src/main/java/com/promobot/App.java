package com.promobot;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class App {

    @PostConstruct
    public void init() {
        // Forca timezone Brasil/Sao_Paulo para LocalDateTime.now(),
        // logs do Logback e serializacao do Jackson.
        TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
    }

    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
