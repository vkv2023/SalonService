package com.salon.model;

import com.salon.domain.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.apache.logging.log4j.message.Message;

import java.util.Date;

@Entity
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseModels{

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String fullName;

    @NotBlank(message = "username can't be blank!")
    private String username;

    @NotBlank(message = "First name can't be blank!")
    private String fname;

    private String lname;

    @NotBlank(message = "Email is Mandatory!")
    @Email(message = "Enter valid email!")
    private String email;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @NotBlank(message = "Password is must!")
    private String password;

}
