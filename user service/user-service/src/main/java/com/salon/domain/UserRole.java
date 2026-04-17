package com.salon.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum UserRole {
    CUSTOMER,
    ADMIN,
    SALON_OWNER;

    @JsonCreator
    public static UserRole fromValue(String value) {
        if (value == null) {
            return null;
        }
        return UserRole.valueOf(value.trim().toUpperCase());
    }

    @JsonValue
    public String toValue() {
        return name(); // response always uppercase
    }
}
