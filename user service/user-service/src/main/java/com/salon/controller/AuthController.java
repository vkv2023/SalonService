package com.salon.controller;

import com.salon.payloadResponse.AuthResponse;
import com.salon.payloadResponse.dto.LoginDTO;
import com.salon.payloadResponse.dto.SignupDTO;
import com.salon.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth/")
public class AuthController {

    private final AuthService authService;

    @PostMapping("signup")
    public ResponseEntity<AuthResponse> signUp(@RequestBody SignupDTO signupDTO) throws Exception {
        log.info("Signup request: {}", signupDTO.getUsername());
        AuthResponse authResponse = authService.signUp(signupDTO);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginDTO loginDTO) throws Exception {
        AuthResponse authResponse = authService.login(loginDTO.getUsername(), loginDTO.getPassword());
        return ResponseEntity.ok(authResponse);
    }

    @GetMapping("access-token/refresh-token/{refreshToken}")
    public ResponseEntity<AuthResponse> getAccessToken
            (@PathVariable String refreshToken) throws Exception {
        AuthResponse authResponse = authService.getAccessTokenFromRefreshToken(refreshToken);
        return ResponseEntity.ok(authResponse);
    }
}
