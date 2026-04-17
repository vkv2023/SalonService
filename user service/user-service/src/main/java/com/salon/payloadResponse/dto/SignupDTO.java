package com.salon.payloadResponse.dto;

import com.salon.domain.UserRole;
import lombok.Data;

@Data
public class SignupDTO {

    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String username;
    private UserRole role;
}
