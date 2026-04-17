package com.salon.category.service;

import com.salon.category.dto.SalonDTO;
import com.salon.category.model.Category;

import java.util.Set;


public interface CategoryService {
    Category saveCategory(Category category, SalonDTO salonDTO);
    Set<Category> getAllCategoriesBySalon(Long salonId);
    Category getCategoryById(Long id) throws Exception;
    void deleteCategoryById(Long id, Long salonId) throws Exception;
}
