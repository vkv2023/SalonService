package com.salon.service;

import com.salon.payloadResponse.AuthResponse;
import com.salon.payloadResponse.dto.SignupDTO;

public interface AuthService {
    AuthResponse login(String username, String password) throws Exception;
    AuthResponse signUp(SignupDTO signupDTOReq) throws Exception;
    AuthResponse getAccessTokenFromRefreshToken(String refreshToken) throws Exception;
}
