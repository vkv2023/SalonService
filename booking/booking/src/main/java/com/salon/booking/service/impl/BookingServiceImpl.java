package com.salon.booking.service.impl;

import com.salon.booking.domain.BookingStatus;
import com.salon.booking.dto.BookingRequest;
import com.salon.booking.dto.SalonDTO;
import com.salon.booking.dto.ServiceDTO;
import com.salon.booking.dto.UserDTO;
import com.salon.booking.model.Booking;
import com.salon.booking.model.BookingReport;
import com.salon.booking.repository.BookingServiceRepository;
import com.salon.booking.service.BookingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@RequiredArgsConstructor
@Service
public class BookingServiceImpl implements BookingService {

    private final BookingServiceRepository bookingServiceRepository;

    @Override
    public Booking createBooking(BookingRequest bookingRequest,
                                 UserDTO userDTO,
                                 SalonDTO salonDTO,
                                 Set<ServiceDTO> serviceDTOSet) throws Exception {

        BookingReport report = new BookingReport();

//        Calculate total duration to serve the service.
//        this will provide us the endTime

        int totalDuration = serviceDTOSet.stream()
                            .mapToInt(ServiceDTO::getDuration)
                            .sum();

        LocalDateTime bookingStartTime = bookingRequest.getStartDateTime();
        LocalDateTime bookingEndTime = bookingStartTime.plusMinutes(totalDuration);

//        First check timeslot before booking the slot.
//        then check that booking time slot within the range of open and close time
//        No overlap with any other booking and outside the boundary of salon open close time

        Boolean isSlotAvailable = isTimeSlotAvailable(salonDTO, bookingStartTime, bookingEndTime);

        int totalPrice = serviceDTOSet.stream()
                .mapToInt(ServiceDTO::getPrice)
                .sum();

        Set<Long> idList = serviceDTOSet.stream()
                .map(ServiceDTO::getId)
                .collect(Collectors.toSet());

        Booking newBooking = Booking.builder()
                .customerId(userDTO.getId())
                .salonId(salonDTO.getId())
                .bookingStatus(BookingStatus.PENDING)
                .serviceIds(idList)
                .startTime(bookingStartTime)
                .endTime(bookingEndTime)
                .totalPrice(totalPrice)
                .build();

        return bookingServiceRepository.save(newBooking);

    }

    @Override
    public List<Booking> getBookingsByCustomer(Long customerId) throws Exception {
          List<Booking> booking = bookingServiceRepository.findByCustomerId(customerId);
        if (booking == null || booking.isEmpty()){
            throw new Exception("Booking not found for the Customer : " + customerId);
        }
        return booking;
    }

    @Override
    public List<Booking> getBookingBySalonId(Long salonId) throws Exception {
        List<Booking> booking = bookingServiceRepository.findBySalonId(salonId);
        if (booking == null || booking.isEmpty()){
            throw new Exception("Booking not found for the salonID" + salonId);
        }
        return booking;
    }

    @Override
    public List<Booking> getBookingByDate(Long salonId, LocalDate localDate) throws Exception {
        List<Booking> allBookings = getBookingBySalonId(salonId);
        if (localDate == null){
            return allBookings;
        }
        allBookings.stream()
                .filter(booking -> isSameDate(booking.getStartTime(),localDate) ||
                        isSameDate(booking.getEndTime(),localDate))
                .collect(Collectors.toList());
        return allBookings;
    }

    @Override
    public Booking getBookingByBookingId(Long bookingId) throws Exception {
        Booking booking = bookingServiceRepository.findById(bookingId).orElse(null);
        if (booking==null){
            throw new Exception("Booking not found for the booking id : " + bookingId);
        }
        return booking;
    }

    @Override
    public Booking updateBookingByBookingId(Long bookingId, BookingStatus bookingStatus) {
        Booking booking = bookingServiceRepository.findById(bookingId).orElse(null);
        booking.setBookingStatus(bookingStatus);

        return bookingServiceRepository.save(booking);
    }

    @Override
    public void deleteBooking(Long bookingId, BookingStatus bookingStatus) {

    }

// iterate through all the bookings and check if requested timeslot is
//        not overlapping with the existing bookings

    public Boolean isTimeSlotAvailable(SalonDTO salonDTO,
                                       LocalDateTime bookingStartTime,
                                       LocalDateTime bookingEndTime) throws Exception {

        LocalDateTime salonOpenTime = salonDTO.getOpenTime().atDate(bookingStartTime.toLocalDate());
        LocalDateTime salonCloseTime = salonDTO.getCloseTime().atDate(bookingEndTime.toLocalDate());

        List<Booking> existingBookings = getBookingBySalonId(salonDTO.getId());

        if (bookingStartTime.isBefore(salonOpenTime) ||
                bookingEndTime.isAfter(salonCloseTime)){
            throw new Exception("Booking time must be within salon's working hours.");
        }

        for(Booking existingBooking: existingBookings){
            LocalDateTime existingBookingStartTime = existingBooking.getStartTime();
            LocalDateTime existingBookingEndTime = existingBooking.getEndTime();

            if(existingBookingStartTime.isBefore(bookingEndTime)
            || existingBookingEndTime.isAfter(bookingStartTime)){
                throw new Exception("Slot is not available, please book another slot.");
            }

            if (existingBookingStartTime.equals(bookingStartTime) ||
            existingBookingEndTime.equals(bookingEndTime)){
                throw new Exception("Slot is not available, please book another slot.");
            }
        }
        return true;
    }

    @Override
    public BookingReport getBookingReport(Long salonId) throws Exception {
        List<Booking> allBookings = getBookingBySalonId(salonId);

        Double totalEarnings = allBookings.stream()
                .mapToDouble(Booking::getTotalPrice)
                .sum();
        int totalBookings = allBookings.size();

        List<Booking> canceledBookings = allBookings.stream()
                .filter(booking -> booking.getBookingStatus().equals(BookingStatus.CANCEL))
                .collect(Collectors.toList());

        Double totalRefund = canceledBookings.stream()
                .mapToDouble(Booking::getTotalPrice)
                .sum();

        BookingReport report = BookingReport.builder()
                .salonId(salonId)
                .totalBookings(totalBookings)
                .totalEarnings(totalEarnings)
                .totalCanceledBookings(canceledBookings.size())
                .totalRefund(totalRefund)
                .build();

        return report;
    }

    private boolean isSameDate(LocalDateTime dateTime, LocalDate date){
        return dateTime.toLocalDate().isEqual(date);
    }
}
