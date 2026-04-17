package com.salon.booking.dto;

import com.salon.booking.domain.BookingStatus;
import jakarta.persistence.ElementCollection;
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
    private BookingStatus bookingStatus = BookingStatus.PENDING;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int totalPrice;
}
