package com.salon.payloadResponse.dto;

import lombok.Data;

@Data
public class UserRequestCredentials {

    private String type;
    private String value;
    private boolean temporary;
}
