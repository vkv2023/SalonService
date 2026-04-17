package com.salon.service;

import com.salon.exception.UserException;
import com.salon.model.User;

import java.util.List;

public interface UserService {
    User createUser(User user);
    User getUserById(Long id) throws UserException;
    List<User> getAllUsers();
    User updateUser(User reqUser, Long id)  throws UserException;
    void deleteUser(Long id)  throws UserException;
}
