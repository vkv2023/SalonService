package com.salon.service_offering.dto;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
public class CategoryDTO {
    private Long id;
    private String name;
    private String image;
}
