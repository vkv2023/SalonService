package com.salon.salon_service.mapper;

import com.salon.salon_service.dto.SalonDTO;
import com.salon.salon_service.model.Salon;

public class SalonMapper {

    public static SalonDTO mapToDto(Salon salon){
        SalonDTO salonDTO = new SalonDTO();

        salonDTO.setId(salon.getId());
        salonDTO.setName(salon.getName());
        salonDTO.setImages(salon.getImages());
        salonDTO.setAddress(salon.getAddress());
        salonDTO.setEmail(salon.getEmail());
        salonDTO.setPhone(salon.getPhone());
        salonDTO.setOwnerId(salon.getOwnerId());
        salonDTO.setCity(salon.getCity());
        salonDTO.setOpenTime(salon.getOpenTime());
        salonDTO.setCloseTime(salon.getCloseTime());

        return salonDTO;
    }
}
