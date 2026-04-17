package com.salon.payloadResponse.dto;

import lombok.Data;
import org.springframework.boot.autoconfigure.ldap.embedded.EmbeddedLdapProperties;

import java.util.ArrayList;
import java.util.List;

@Data
public class UserRequest {

    private String username;
    private boolean enabled;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private List<UserRequestCredentials> credentials = new ArrayList<>();

}
