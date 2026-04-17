package com.salon.service.serviceImpl;

import com.salon.domain.UserRole;
import com.salon.model.User;
import com.salon.payloadResponse.AuthResponse;
import com.salon.payloadResponse.TokenResponse;
import com.salon.payloadResponse.dto.SignupDTO;
import com.salon.repository.UserRepository;
import com.salon.service.AuthService;
import com.salon.service.KeycloakService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final KeycloakService keycloakService;


    @Override
    public AuthResponse login(String username, String password) throws Exception {

        TokenResponse tokenResponse = keycloakService.getAdminAccessToken(
                username,
                password,
                "password",
                null);


        AuthResponse authResponse = new AuthResponse();
        authResponse.setRefresh_token(tokenResponse.getRefreshToken());
        authResponse.setJwt(tokenResponse.getAccessToken());
        authResponse.setMessage("Login Success!");

        return authResponse;
    }


    //First, we'll create a user in keycloak and then in DB

    @Override
    public AuthResponse signUp(SignupDTO signupDTOReq) throws Exception {
        keycloakService.createUser(signupDTOReq);

        User user = new User();
        user.setUsername(signupDTOReq.getUsername());
        user.setEmail(signupDTOReq.getEmail());
        user.setPassword(signupDTOReq.getPassword());
        user.setRole(signupDTOReq.getRole());
        user.setFullName(signupDTOReq.getFirstName() + " " + signupDTOReq.getLastName());
        user.setGeneratedDate(new Date());
        userRepository.save(user);

        //Get the user access token the new user
//        TokenResponse tokenResponse = keycloakService.getAdminAccessToken(
        TokenResponse tokenResponse = keycloakService.getAdminAccessToken(
                signupDTOReq.getUsername(),
                signupDTOReq.getPassword(),
                "password",
                null);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setRefresh_token(tokenResponse.getRefreshToken());
        authResponse.setJwt(tokenResponse.getAccessToken());
        authResponse.setUserRole(user.getRole());
        authResponse.setMessage("User registered Successfully!");

        return authResponse;
    }

    @Override
    public AuthResponse getAccessTokenFromRefreshToken(String refreshToken) throws Exception {

        TokenResponse tokenResponse = keycloakService.getAdminAccessToken(null,
                null, "refresh_token", refreshToken );

        AuthResponse authResponse = new AuthResponse();
        authResponse.setRefresh_token(tokenResponse.getRefreshToken());
        authResponse.setJwt(tokenResponse.getAccessToken());
        authResponse.setMessage("Access from Refresh Token Received!");

        return authResponse;
    }
}
