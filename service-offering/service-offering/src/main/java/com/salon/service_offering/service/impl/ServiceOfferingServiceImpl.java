package com.salon.service_offering.service.impl;

import com.salon.service_offering.dto.CategoryDTO;
import com.salon.service_offering.dto.SalonDTO;
import com.salon.service_offering.dto.ServiceDTO;
import com.salon.service_offering.model.ServiceOffering;
import com.salon.service_offering.repository.ServiceOfferingRepository;
import com.salon.service_offering.service.ServiceOfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceOfferingServiceImpl implements ServiceOfferingService {

    private final ServiceOfferingRepository serviceOfferingRepository;

    @Override
    public ServiceOffering createService(SalonDTO salonDto, CategoryDTO categoryDto, ServiceDTO serviceDTO) {
        ServiceOffering serviceOffering = new ServiceOffering();

        serviceOffering.setName(serviceDTO.getName());
        serviceOffering.setDescription(serviceDTO.getDescription());
        serviceOffering.setImage(serviceDTO.getImage());
        serviceOffering.setPrice(serviceDTO.getPrice());
        serviceOffering.setDuration(serviceDTO.getDuration());
        serviceOffering.setCategoryId(categoryDto.getId());
        serviceOffering.setSalonId(salonDto.getId());

        return serviceOfferingRepository.save(serviceOffering);
    }

    @Override
    public ServiceOffering updateService(Long serviceId, ServiceOffering serviceOffering) throws Exception {
        ServiceOffering serviceOffering1 =
                serviceOfferingRepository.findById(serviceId).orElse(null);

        if (serviceOffering1==null){
            throw new Exception("Service doesn't exist with id:" + serviceId);
        }
        serviceOffering1.setName(serviceOffering.getName());
        serviceOffering1.setDescription(serviceOffering.getDescription());
        serviceOffering1.setImage(serviceOffering.getImage());
        serviceOffering1.setPrice(serviceOffering.getPrice());
        serviceOffering1.setDuration(serviceOffering.getDuration());

        return serviceOfferingRepository.save(serviceOffering);
    }

    @Override
    public Set<ServiceOffering> getAllServiceBySalonId(Long salonId, Long categoryId) {
        Set<ServiceOffering> serviceOfferings =
                serviceOfferingRepository.findBySalonId(salonId);
        if(categoryId != null){
            serviceOfferings = serviceOfferings.stream().filter(
                    (serviceOffering) -> serviceOffering.getCategoryId() != null
            && serviceOffering.getCategoryId() == categoryId).collect(Collectors.toSet());
        }
        return serviceOfferings;
    }

    @Override
    public Set<ServiceOffering> getServicesById(Set<Long> serviceIds) {
        List<ServiceOffering> serviceOfferings =
                serviceOfferingRepository.findAllById(serviceIds);
        return new HashSet<>(serviceOfferings);
    }

    @Override
    public ServiceOffering getServiceById(Long serviceId) throws Exception {
        ServiceOffering serviceOffering1 =
                serviceOfferingRepository.findById(serviceId).orElse(null);

        if (serviceOffering1==null){
            throw new Exception("Service doesn't exist with id:" + serviceId);
        }
        return serviceOffering1;
    }
}
