package com.salon.category.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.boot.autoconfigure.web.WebProperties;

@Entity
@Data
public class Category extends BaseModels{

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false    )
    private String name;

    private String image;

    @Column(nullable = false)
    private Long salonId;

}
