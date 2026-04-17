package com.salon.booking.dto;

import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Data
@Getter
@Setter
@RequiredArgsConstructor
public class UserDTO {
    private Long id;
    private String fName;
    private String lName;
    private String phone;
    private String email;
}
