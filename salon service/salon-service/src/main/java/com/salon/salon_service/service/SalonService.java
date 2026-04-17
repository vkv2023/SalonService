package com.salon.salon_service.service;

import com.salon.salon_service.dto.SalonDTO;
import com.salon.salon_service.dto.UserDTO;
import com.salon.salon_service.model.Salon;

import java.util.List;

public interface SalonService {
    Salon createSalon(SalonDTO salon, UserDTO user);
    Salon updateSalon(SalonDTO salon, UserDTO user, Long salonId) throws Exception;
    List<Salon> getAllSalons();
    Salon getSalonById(Long Id) throws Exception;
    Salon getSalonByOwnerId(Long ownerId) throws Exception;
    List<Salon> searchSalonByCity(String cityName) throws Exception;
}
