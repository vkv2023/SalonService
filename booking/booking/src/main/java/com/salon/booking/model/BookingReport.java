package com.salon.booking.model;

import jakarta.persistence.Entity;
import lombok.*;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class BookingReport {
    private Long salonId;
    private String salonName;
    private Double totalEarnings;
    private Integer totalBookings;
    private Integer totalCanceledBookings;
    private Double totalRefund;
}
