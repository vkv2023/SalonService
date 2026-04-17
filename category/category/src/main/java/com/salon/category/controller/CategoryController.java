package com.salon.category.controller;

import com.salon.category.model.Category;
import com.salon.category.service.CategoryService;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private final CategoryService categoryService = null;

    @GetMapping("/salon/{id}")
    public ResponseEntity<Set<Category>> getCategoriesBySalonId(
            @PathVariable Long id){
        Set<Category> categories = categoryService.getAllCategoriesBySalon(id);
        return new ResponseEntity<>(categories,HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(
            @PathVariable Long id) throws Exception {
        Category category = categoryService.getCategoryById(id);
        return new ResponseEntity<>(category,HttpStatus.OK);
    }
}
