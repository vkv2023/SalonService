package com.salon.category.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/api/category/home")
    public String HomeControllerHandler(){
        return "Category microservice is up and running...";
    }
}
