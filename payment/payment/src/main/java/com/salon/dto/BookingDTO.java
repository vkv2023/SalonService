package com.salon.dto;

//import com.salon.booking.domain.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class BookingDTO {
    private Long id;
    private Long salonId;
    private Long customerId;
    private Set<Long> serviceIds;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int totalPrice;
}
