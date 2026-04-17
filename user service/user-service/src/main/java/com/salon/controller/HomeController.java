package com.salon.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/api/home")
    public String HomeControllerHandler(){
        return "user microservices for salon booking services..";
    }
}
