package com.salon.service.serviceImpl;

import com.salon.exception.UserException;
import com.salon.model.User;
import com.salon.repository.UserRepository;
import com.salon.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public User getUserById(Long id) throws UserException {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()){
            return user.get();
        }
        throw new UserException("user not found..");
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User updateUser(User reqUser, Long id) throws UserException {
        Optional<User> updateUser = userRepository.findById(id);
        if(updateUser.isEmpty()){
            throw new UserException("user with " + id + " is not available");
        }

        User existingUser = updateUser.get();

        existingUser.setFname(reqUser.getFname());
        existingUser.setLname(reqUser.getLname());
        existingUser.setEmail(reqUser.getEmail());
        existingUser.setPhone(reqUser.getPhone());
        existingUser.setRole(reqUser.getRole());
        existingUser.setPassword(reqUser.getPassword());

        return userRepository.save(existingUser);
    }

    @Override
    public void deleteUser(Long id) throws UserException {
        Optional<User> isUser = userRepository.findById(id);
        if(isUser.isEmpty()){
            throw  new UserException("User not available with id:" + id);
        }
        userRepository.deleteById(isUser.get().getId());
    }
}
