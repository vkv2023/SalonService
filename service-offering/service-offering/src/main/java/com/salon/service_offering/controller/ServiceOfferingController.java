package com.salon.service_offering.controller;

import com.salon.service_offering.model.ServiceOffering;
import com.salon.service_offering.service.ServiceOfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/service_offering")
public class ServiceOfferingController {

    private final ServiceOfferingService serviceOfferingService;

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<Set<ServiceOffering>> getServicesBySalonId(
            @PathVariable Long salonId,
            @RequestParam(required = false) Long categoryId){
        Set<ServiceOffering> serviceOfferings =
                serviceOfferingService.getAllServiceBySalonId(salonId, categoryId);
        return new ResponseEntity<>(serviceOfferings,HttpStatus.OK);
    }

    @GetMapping("/{serviceId}")
    public ResponseEntity<ServiceOffering> getServiceByServiceId(
            @PathVariable Long serviceId) throws Exception {
        ServiceOffering serviceOffering =
                serviceOfferingService.getServiceById(serviceId);
        return new ResponseEntity<>(serviceOffering,HttpStatus.OK);
    }

    @GetMapping("/list/{serviceIds}")
    public ResponseEntity<Set<ServiceOffering>> getServicesById(
            @PathVariable Set<Long> serviceIds) throws Exception {
        Set<ServiceOffering> serviceOfferingSet =
                serviceOfferingService.getServicesById(serviceIds);
        return new ResponseEntity<>(serviceOfferingSet,HttpStatus.OK);
    }


}
