package com.salon.booking.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/api/bookings/home")
    public String HomeControllerHandler(){
        return ("booking microservice is up and running..");
    }
}
