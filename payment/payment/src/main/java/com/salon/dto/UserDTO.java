package com.salon.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String fName;
    private String lName;
    private String phone;
    private String email;
}
