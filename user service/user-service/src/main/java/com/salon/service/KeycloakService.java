package com.salon.service;

import com.salon.payloadResponse.TokenResponse;
import com.salon.payloadResponse.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
Correct Signup Flow
    Steps:
        Get admin access token from Keycloak using the admin user (e.g., vinod).
        Use that token to create a new user in Keycloak.
        Assign the role to the new user.
        Save the user in your local database.
        Optionally, get an access token for the new user (so they can log in immediately).
 **/

@Service
@RequiredArgsConstructor
public class KeycloakService {
    private static final String KEYCLOCK_BASE_URL = "http://192.168.1.1:8080";
    private static final String KEYCLOAK_ADMIN_URL = KEYCLOCK_BASE_URL + "/admin/realms/master/users";
    private static final String TOKEN_URL = KEYCLOCK_BASE_URL + "/realms/master/protocol/openid-connect/token";
    private static final String CLIENT_ID = "salon-booking-client";
    private static final String CLIENT_SECRET = "1IXDLPsXsoAgs7Y8iNiWAMRRpSq0MoDs";
    private static final String GRANT_TYPE = "password";
    private static final String scope = "openid email profile";
    private static final String username = "vinod";
    private static final String password = "vinod";
    private static final String clientId = "49539083-37af-4305-8eb4-b14d8f8275f1"; // copied from the keycloak url from client's, not client secret

    // to access external APIs, use restTemplate from AppConfig
    private final RestTemplate restTemplate;

    public  void createUser(SignupDTO signupDTO) throws Exception{

        /**
            1. Spring Boot requests an admin token (using vinod / admin user credentials).
            2. Use that token to create a new user in Keycloak.
            3. Then optionally log in the new user to get their user access token.
**/

        String ACCESS_TOKEN = getAdminAccessToken(
                username,
                password,
                GRANT_TYPE,
                null).getAccessToken();


        UserRequest userRequest = getUserRequest(signupDTO);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(ACCESS_TOKEN);

        HttpEntity<UserRequest> requestHttpEntity = new HttpEntity<>(userRequest,headers);

        // After calling this method, we'll create a user
        ResponseEntity<String> response = restTemplate.exchange(
          KEYCLOAK_ADMIN_URL,
          HttpMethod.POST,
          requestHttpEntity,
          String.class
        );

        if (response.getStatusCode() == HttpStatus.CREATED) {
            System.out.println("User created successfully..");


            // Get the newly created user by name
            KeycloakUserDTO newUser = fetchFirstUserByUserName(
                    signupDTO.getUsername(),
                    ACCESS_TOKEN);

            // After creating a user, we need to get a role for user
            KeycloakRole userRole = getRoleByName(clientId,
                    ACCESS_TOKEN,
                    signupDTO.getRole().toString());

            List<KeycloakRole> roles = new ArrayList<>();
            roles.add(userRole);

            assignRoleToUser(newUser.getId(), clientId, roles, ACCESS_TOKEN);
        }else {
                System.out.println("User Creation Failed");
                throw new Exception(response.getBody());
        }
    }

    // Method to extract UserRequest along with Credentials
    private static UserRequest getUserRequest(SignupDTO signupDTO) {
        UserRequestCredentials userRequestCredentials = new UserRequestCredentials();
        userRequestCredentials.setTemporary(false);
        userRequestCredentials.setType("password");
        userRequestCredentials.setValue(signupDTO.getPassword());

        UserRequest userRequest = new UserRequest();
        userRequest.setUsername(signupDTO.getUsername());
        userRequest.setEmail(signupDTO.getEmail());
        userRequest.setFirstName(signupDTO.getFirstName());
        userRequest.setLastName(signupDTO.getLastName());
        userRequest.getCredentials().add(userRequestCredentials);
        userRequest.setEnabled(true);
        return userRequest;
    }


    public TokenResponse getAdminAccessToken(String username,
                                             String password,
                                             String grantType,
                                             String refreshToken) throws Exception {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("grant_type", grantType);
        requestBody.add("client_id",CLIENT_ID);
        requestBody.add("client_secret",CLIENT_SECRET);
//        requestBody.add("client_id", "admin-cli"); // will be used for admin token

        if ("password".equals(grantType)) {
            requestBody.add("username", username);
            requestBody.add("password", password);
            requestBody.add("scope", scope);
        }

        if ("refresh_token".equals(grantType)) {
            requestBody.add("refresh_token", refreshToken);
        }

        HttpEntity<MultiValueMap<String, String>> requestHttpEntity =
                new HttpEntity<>(requestBody, headers);

        //  "http://localhost:8080/realms/master/protocol/openid-connect/token"
        ResponseEntity<TokenResponse> response =
                restTemplate.exchange(
                        TOKEN_URL,
                        HttpMethod.POST,
                        requestHttpEntity,
                        TokenResponse.class);

        if (response.getStatusCode()==HttpStatus.OK && response.getBody() != null) {
            return response.getBody();
        }
        throw new Exception("Failed to obtain access token..");
    }

    //http://localhost:8080/admin/realms/master/clients/49539083-37af-4305-8eb4-b14d8f8275f1/roles/CUSTOMER
    public KeycloakRole getRoleByName(String clientId,
                                      String token,
                                      String role) throws Exception {
        String url = KEYCLOCK_BASE_URL + "/admin/realms/master/clients/" + clientId + "/roles/" +role;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization","Bearer" + token);

        HttpEntity<Void> requestHttpEntity =
                new HttpEntity<>(headers);

        /* After calling this method, we'll create a user*/
        ResponseEntity<KeycloakRole> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                requestHttpEntity,
                KeycloakRole.class
        );

        if (response.getBody() != null) {
            return response.getBody();
        }
        throw new Exception("Failed to obtain role..");
    }

    public KeycloakUserDTO fetchFirstUserByUserName(String username,
                                                String token) throws Exception {
    String url = KEYCLOCK_BASE_URL + "/admin/realms/master/users?username="+ username;

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);
    headers.setContentType(MediaType.APPLICATION_JSON);


    HttpEntity<String> requestHttpEntity =
            new HttpEntity<>(headers);

    /* After calling this method, we'll create a user*/
    ResponseEntity<KeycloakUserDTO[]> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            requestHttpEntity,
            KeycloakUserDTO[].class
    );

    KeycloakUserDTO[] users = response.getBody();

    if (users!= null && users.length >0){
        return users[0];
    }
    throw new Exception("User not found with the name." + username);
}


    // http://localhost:8080/admin/realms/master/users/userId/role-mappings/clients/clientId
    public void assignRoleToUser(String userId,
                                 String clientId,
                                 List<KeycloakRole> roles,
                                 String token) throws Exception {

        String url = KEYCLOCK_BASE_URL + "/admin/realms/master/users/" + userId + "/role-mappings/clients/" + clientId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<List<KeycloakRole>> requestHttpEntity =
                new HttpEntity<>(roles, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestHttpEntity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to assign role: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new Exception("unable to assign role to the user " + e.getMessage());
        }
    }

}
