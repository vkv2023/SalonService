package com.salon.salon_service.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/api/salon/home")
    public String HomeControllerHandler(){
        return "Salon microservice is up and running...";
    }

}
