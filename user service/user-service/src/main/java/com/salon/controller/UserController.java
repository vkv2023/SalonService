package com.salon.controller;

import com.salon.exception.UserException;
import com.salon.model.User;
import com.salon.repository.UserRepository;
import com.salon.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

   @Autowired
    private final UserService userService; //since is it autowired, it's not null anymore

    @PostMapping()
    public ResponseEntity<User> createUser(@RequestBody @Valid User user){
        User createdUser = userService.createUser(user);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @GetMapping()
    public ResponseEntity<List<User>> getUsers(){
        List<User> users = userService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/{userid}")
    public ResponseEntity<User> getUserById(@PathVariable("userid") Long id) throws UserException {
        User user = userService.getUserById(id);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @PutMapping("{id}")
    public ResponseEntity<User> updateUser(@RequestBody User reqUser,
                           @PathVariable Long id) throws Exception {
        User updatedUser = userService.updateUser(reqUser, id);
        return new ResponseEntity<>(updatedUser,HttpStatus.ACCEPTED);
    }

    @DeleteMapping("{userId}")
    public ResponseEntity<String> deleteUser(@PathVariable("userId") Long id) throws Exception {
        userService.deleteUser(id);
        return new ResponseEntity<>("User Deleted", HttpStatus.ACCEPTED);
    }
}
