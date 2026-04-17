package com.salon.service_offering.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/api/service-offering/home")
    public String HomeControllerHandler(){
        return ("Service-Offering microservices for salon booking services..");
    }
}
