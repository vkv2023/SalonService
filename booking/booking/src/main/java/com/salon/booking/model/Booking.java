package com.salon.booking.model;

import com.salon.booking.domain.BookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

@Builder
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking extends BaseModels {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private Long salonId;

    private Long customerId;

    @ElementCollection
    private Set<Long> serviceIds;

    private BookingStatus bookingStatus = BookingStatus.PENDING;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private int totalPrice;

}
