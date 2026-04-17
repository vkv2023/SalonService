package com.salon.booking.service;

import com.salon.booking.domain.BookingStatus;
import com.salon.booking.dto.*;
import com.salon.booking.model.Booking;
import com.salon.booking.model.BookingReport;
import org.springframework.stereotype.Service;

import java.awt.print.Book;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface BookingService {
    Booking createBooking(BookingRequest booking, UserDTO userDTO,
                          SalonDTO salonDTO, Set<ServiceDTO> serviceDTOSet) throws Exception;
    List<Booking> getBookingsByCustomer(Long CustomerId) throws Exception;
    List<Booking> getBookingBySalonId(Long SalonId) throws Exception;
    List<Booking> getBookingByDate(Long SalonId, LocalDate localDate) throws Exception;
    Booking getBookingByBookingId(Long bookingId) throws Exception;
    Booking updateBookingByBookingId(Long bookingId, BookingStatus bookingStatus);
    BookingReport getBookingReport(Long salonId) throws Exception;
    void deleteBooking(Long bookingId, BookingStatus bookingStatus);

}
