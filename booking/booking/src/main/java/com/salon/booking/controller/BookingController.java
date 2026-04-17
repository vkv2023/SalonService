package com.salon.booking.controller;

import com.salon.booking.domain.BookingStatus;
import com.salon.booking.dto.*;
import com.salon.booking.mapper.BookingMapper;
import com.salon.booking.model.Booking;
import com.salon.booking.model.BookingReport;
import com.salon.booking.repository.BookingServiceRepository;
import com.salon.booking.service.BookingService;
import com.salon.booking.service.impl.BookingServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.print.Book;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    @Autowired
    private final BookingService bookingService;

    @PostMapping()
    public ResponseEntity<Booking> createBooking(@RequestParam Long salonId,
                                                 @RequestBody BookingRequest
                                                 bookingRequest) throws Exception {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(2L);

        SalonDTO salonDTO = new SalonDTO();
        salonDTO.setId(salonId);
        salonDTO.setOpenTime(LocalTime.of(9, 0));
        salonDTO.setCloseTime(LocalTime.of(18, 0));

        Set<ServiceDTO> serviceDTOSet = new HashSet<>();

        ServiceDTO serviceDTO = new ServiceDTO();

        serviceDTO.setId(2L);
        serviceDTO.setPrice(399);
        serviceDTO.setDuration(45);
        serviceDTO.setName("Haircut for Man");

        serviceDTOSet.add(serviceDTO);

        if (serviceDTOSet.isEmpty()) {
            throw new Exception("empty list");
        }

        Booking booking= bookingService.createBooking(bookingRequest,
                userDTO,
                salonDTO,
                serviceDTOSet);

        return new ResponseEntity<>(booking, HttpStatus.CREATED);
    }

//    Change Path variable ot UserDTO to userDTO

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Set<BookingDTO>> getBookingByCustomerId(
            @PathVariable Long customerId) throws Exception {

//        UserDTO userDTO = new UserDTO();
//        userDTO.setId(1L);

        List<Booking> bookings = bookingService.getBookingsByCustomer(customerId);
        return new ResponseEntity<>(getBookingDTOs(bookings),HttpStatus.OK);
    }

    //    Change Path variable ot SalonDTO to salonDTO

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<Set<BookingDTO>> getBookingByASalonId(
            @PathVariable Long salonId) throws Exception {

//        SalonDTO salonDTO = new SalonDTO();
//        salonDTO.setId(1L);

        List<Booking> bookings = bookingService.getBookingBySalonId(salonId);
        return new ResponseEntity<>(getBookingDTOs(bookings),HttpStatus.OK);
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingDTO> getBookingByBookingId(
            @PathVariable Long bookingId) throws Exception {
        Booking booking = bookingService.getBookingByBookingId(bookingId);

        return new ResponseEntity<>(BookingMapper.toDTO(booking),HttpStatus.OK);
//        return ResponseEntity.ok(booking);
    }

    @GetMapping("/slots/salon/{salonId}/date/{date}")
    public ResponseEntity<List<BookingSlotDTO>> getBookedSlot(
            @PathVariable Long salonId,
            @PathVariable LocalDate date) throws Exception {
        List<Booking> bookings = bookingService.getBookingByDate(salonId,date);

        List<BookingSlotDTO> slotDTOS = bookings.stream()
                .map(booking -> {
                          BookingSlotDTO slotDTO = new BookingSlotDTO();
                          slotDTO.setStartTime(booking.getStartTime());
                          slotDTO.setEndTime(booking.getEndTime());
                          return slotDTO;
                    }).collect(Collectors.toList());

        return new ResponseEntity<>(slotDTOS,HttpStatus.OK);
    }


    @GetMapping("/report/{salonId}")
    public ResponseEntity<BookingReport> getBookingReport(
            @PathVariable Long salonId) throws Exception {

        BookingReport report = bookingService.getBookingReport(salonId);

        return new ResponseEntity<>(report,HttpStatus.OK);
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<BookingDTO> getBookingByBookingId(
            @PathVariable Long bookingId,
            @RequestParam BookingStatus bookingStatus) throws Exception {

        Booking booking = bookingService.updateBookingByBookingId(bookingId,bookingStatus);

        return new ResponseEntity<>(BookingMapper.toDTO(booking),HttpStatus.ACCEPTED);
    }

    // function to support the mapping between bookingDTO anf Mapper
    public Set<BookingDTO> getBookingDTOs(List<Booking> bookings){
        return bookings.stream()
                .map(booking -> BookingMapper.toDTO(booking))
                .collect(Collectors.toSet());
    }
}
