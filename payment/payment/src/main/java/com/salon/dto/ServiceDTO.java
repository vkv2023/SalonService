package com.salon.dto;

import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Data
@RequiredArgsConstructor
@Getter
@Setter
public class ServiceDTO {

    private Long id;
    private String name;
    private String description;
    private int price;
    private int duration;
    private Long salonId;
    private Long categoryId;
    private String image;

}
