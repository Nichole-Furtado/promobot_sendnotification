package com.promobot.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
        "/dashboard", "/dashboard/**",
        "/products",  "/products/**",
        "/promotions", "/promotions/**",
        "/channels",  "/channels/**",
        "/logs",      "/logs/**"
    })
    public String spa() {
        return "forward:/index.html";
    }
}
