package com.salon.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class BookingRequest {

    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private Set<Long> serviceIDs;
}
