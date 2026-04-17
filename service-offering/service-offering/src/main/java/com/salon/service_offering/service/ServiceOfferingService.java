package com.salon.service_offering.service;


import com.salon.service_offering.model.ServiceOffering;
import com.salon.service_offering.dto.CategoryDTO;
import com.salon.service_offering.dto.SalonDTO;
import com.salon.service_offering.dto.ServiceDTO;

import java.util.Set;

public interface ServiceOfferingService {
    ServiceOffering createService(SalonDTO salonDto,
                                         CategoryDTO categoryDto,
                                         ServiceDTO serviceDTO);

    ServiceOffering updateService(Long serviceId,
                                         ServiceOffering serviceOffering) throws Exception;
    Set<ServiceOffering> getAllServiceBySalonId(Long salonId,
                                              Long categoryId);
    Set<ServiceOffering> getServicesById(Set<Long> serviceIds);
    ServiceOffering getServiceById(Long serviceId) throws Exception;

}
