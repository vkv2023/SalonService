package com.salon.booking.mapper;

import com.salon.booking.dto.BookingDTO;
import com.salon.booking.model.Booking;

public class BookingMapper {
    public static BookingDTO toDTO(Booking booking){
        BookingDTO bookingDTO = BookingDTO.builder()
                .id(booking.getId())
                .customerId(booking.getCustomerId())
                .salonId(booking.getSalonId())
                .bookingStatus(booking.getBookingStatus())
                .serviceIds(booking.getServiceIds())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .totalPrice(booking.getTotalPrice())
                .build();
        return bookingDTO;
    }
}
