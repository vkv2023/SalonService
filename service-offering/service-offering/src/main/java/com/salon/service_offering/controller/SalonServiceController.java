package com.salon.service_offering.controller;

import com.salon.service_offering.dto.CategoryDTO;
import com.salon.service_offering.dto.SalonDTO;
import com.salon.service_offering.dto.ServiceDTO;
import com.salon.service_offering.model.ServiceOffering;
import com.salon.service_offering.service.ServiceOfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/service-offering/salon-owner")
public class SalonServiceController {

    @Autowired
    private final ServiceOfferingService serviceOfferingService;

    @PostMapping()
    public ResponseEntity<ServiceOffering> createService(
            @RequestBody ServiceDTO serviceDTO)
    {
        SalonDTO salonDTO = new SalonDTO();
        salonDTO.setId(2L);

        CategoryDTO categoryDTO = new CategoryDTO();
        categoryDTO.setId(serviceDTO.getCategoryId());

        ServiceOffering serviceOffering = serviceOfferingService.createService(
                salonDTO,categoryDTO,serviceDTO);

        return new ResponseEntity<>(serviceOffering, HttpStatus.OK);
    }

    @PostMapping("/{id}")
    public ResponseEntity<ServiceOffering> updateService(@PathVariable Long serviceId,
                                                         @RequestBody ServiceOffering reqServiceOffering) throws Exception {
        ServiceOffering serviceOffering = serviceOfferingService.updateService(
                serviceId,reqServiceOffering);

        return new ResponseEntity<>(serviceOffering, HttpStatus.OK);
    }
}
