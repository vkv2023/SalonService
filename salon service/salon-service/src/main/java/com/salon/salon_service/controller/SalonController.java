package com.salon.salon_service.controller;

import com.salon.salon_service.dto.SalonDTO;
import com.salon.salon_service.dto.UserDTO;
import com.salon.salon_service.mapper.SalonMapper;
import com.salon.salon_service.model.Salon;
import com.salon.salon_service.service.SalonService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/salons")
public class SalonController {

    @Autowired
    private SalonService salonService;

//   POST http://localhost:5002/api/salons
    @PostMapping
    public ResponseEntity<SalonDTO> createSalon(@RequestBody SalonDTO sdto){
        UserDTO uDto = new UserDTO();
        uDto.setId(1L);
        Salon salon = salonService.createSalon(sdto, uDto);
        SalonDTO salonDTO = SalonMapper.mapToDto(salon);
        return new ResponseEntity<>(salonDTO,HttpStatus.CREATED);
    }

    //   GET http://localhost:5002/api/salons
    @GetMapping
    public ResponseEntity<List<SalonDTO>> getSalonList(){
        List<Salon> salons = salonService.getAllSalons();
        List<SalonDTO> salonDTOS = salons.stream().map(salon -> {
            SalonDTO salonDTO = SalonMapper.mapToDto(salon);
            return salonDTO;
        }).toList();
        return ResponseEntity.ok(salonDTOS);
    }

    // PATCH http://localhost:5002/api/salons/1
    @PatchMapping("/{salonId}")
    public ResponseEntity<SalonDTO> updateSalonById(@RequestBody SalonDTO salonDTO,
                                                    @PathVariable("salonId") Long id) throws Exception {
        UserDTO uDto = new UserDTO();
        uDto.setId(1L);
        Salon salon = salonService.updateSalon(salonDTO, uDto, id);
        SalonDTO sDTO = SalonMapper.mapToDto(salon);
        return new ResponseEntity<>(sDTO,HttpStatus.CREATED);
    }

    //   GET http://localhost:5002/api/salons/1
    @GetMapping("/{salonId}")
    public ResponseEntity<SalonDTO> getSalonById(@PathVariable("salonId") Long id) throws Exception {
        Salon salon = salonService.getSalonById(id);
        SalonDTO salonDTO = SalonMapper.mapToDto(salon);
        return new ResponseEntity<>(salonDTO,HttpStatus.OK);
    }

    //   GET http://localhost:5002/api/salons?cityName=Noida
    @GetMapping("/search")
    public ResponseEntity<List<SalonDTO>> searchSalons(@RequestParam("cityName")
                                                       String city) throws Exception{
        List<Salon> salons = salonService.searchSalonByCity(city);
        List<SalonDTO> salonDTOList = salons.stream().map(salon -> {
            SalonDTO salonDTO = SalonMapper.mapToDto(salon);
            return salonDTO;
        }).toList();
        return ResponseEntity.ok(salonDTOList);
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<SalonDTO> getSalonByOwnerId(@PathVariable("ownerId")
                                                            Long id) throws Exception{
        UserDTO userDTO = new UserDTO();
        userDTO.setId(1L);
        Salon salon = salonService.getSalonByOwnerId(userDTO.getId());
        SalonDTO salonDTO = SalonMapper.mapToDto(salon);
        return ResponseEntity.ok(salonDTO);
    }
}
