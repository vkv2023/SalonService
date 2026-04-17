package com.salon.category.repository;

import com.salon.category.model.Category;
import jakarta.persistence.SecondaryTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Set<Category> findBySalonId(Long salonId);
}
