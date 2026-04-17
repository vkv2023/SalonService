package com.salon.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class HomeController {

    @GetMapping("/home")
    public String HomeControlHandler(){
        return ("payment service is up and running..");
    }
}
