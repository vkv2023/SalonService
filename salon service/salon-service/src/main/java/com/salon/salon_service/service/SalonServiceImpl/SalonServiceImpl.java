package com.salon.salon_service.service.SalonServiceImpl;

import com.salon.salon_service.dto.SalonDTO;
import com.salon.salon_service.dto.UserDTO;
import com.salon.salon_service.model.Salon;
import com.salon.salon_service.repository.SalonRepository;
import com.salon.salon_service.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SalonServiceImpl implements SalonService {

    @Autowired
    private final SalonRepository salonRepository;

    @Override
    public Salon createSalon(SalonDTO reqSalon, UserDTO user) {
        Salon salon = new Salon();

        salon.setName(reqSalon.getName());
        salon.setImages(reqSalon.getImages());
        salon.setAddress(reqSalon.getAddress());
        salon.setEmail(reqSalon.getEmail());
        salon.setPhone(reqSalon.getPhone());
        salon.setCity(reqSalon.getCity());
        salon.setOwnerId(user.getId());
        salon.setOpenTime(reqSalon.getOpenTime());
        salon.setCloseTime(reqSalon.getCloseTime());

        return salonRepository.save(salon);
    }

    @Override
    public Salon updateSalon(SalonDTO salon, UserDTO user, Long salonId) throws Exception {
        Salon exisitingSalon = salonRepository.findById(salonId).orElse(null);

        //if user is salon's owner then only he can update else throw an exception
        if (exisitingSalon != null && salon.getOwnerId().equals(user.getId())){
            exisitingSalon.setCity(salon.getCity());
            exisitingSalon.setName(salon.getName());
            exisitingSalon.setImages(salon.getImages());
            exisitingSalon.setAddress(salon.getAddress());
            exisitingSalon.setPhone(salon.getPhone());
            exisitingSalon.setEmail(salon.getEmail());
            exisitingSalon.setOpenTime(salon.getOpenTime());
            exisitingSalon.setCloseTime(salon.getCloseTime());
            exisitingSalon.setOwnerId(salon.getOwnerId());

            return salonRepository.save(exisitingSalon);
        }
        throw new Exception("Salon doesn't exist!");
    }

    @Override
    public List<Salon> getAllSalons() {
        return salonRepository.findAll();
    }

    @Override
    public Salon getSalonById(Long Id) throws Exception {
        Optional<Salon> salon = salonRepository.findById(Id);
        if (salon.isPresent()){
            return salon.get();
        }
        throw new Exception("Salon doesn't exist with id " + Id);
    }

    @Override
    public Salon getSalonByOwnerId(Long ownerId) throws Exception {
        Optional<Salon> salon = Optional.ofNullable(salonRepository.findByOwnerId(ownerId));
        if (salon.isPresent()){
            return salon.get();
        }
        throw new Exception("Salon doesn't exist with id " + ownerId);
    }

    @Override
    public List<Salon> searchSalonByCity(String cityName) throws Exception {
        return salonRepository.searchSalons(cityName);
    }
}
