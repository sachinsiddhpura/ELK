package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.AuthRequest;
import com.ecommerce.auth.dto.AuthResponse;
import com.ecommerce.auth.dto.RegisterRequest;
import com.ecommerce.auth.model.Role;
import com.ecommerce.auth.model.User;
import com.ecommerce.auth.repository.UserRepository;
import com.ecommerce.auth.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        MDC.put("userEmail", request.getEmail());
        MDC.put("userRole", Role.ROLE_CUSTOMER.name());

        try {
            log.info("Processing customer registration request for email: {}", request.getEmail());

            if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
                log.warn("[REGISTRATION FAILED] Email {} is already registered in MySQL users table", request.getEmail());
                throw new IllegalArgumentException("Email address is already in use: " + request.getEmail());
            }

            // Customer registration strictly sets Role = ROLE_CUSTOMER
            User user = new User(
                    request.getName().trim(),
                    request.getEmail().trim().toLowerCase(),
                    passwordEncoder.encode(request.getPassword()),
                    Role.ROLE_CUSTOMER,
                    request.getPhone() != null ? request.getPhone().trim() : null,
                    request.getAddress() != null ? request.getAddress().trim() : null
            );

            User savedUser = userRepository.save(user);
            log.info("Successfully registered new customer ID {} with email {}", savedUser.getId(), savedUser.getEmail());

            String token = jwtUtil.generateToken(savedUser);
            return new AuthResponse(
                    token,
                    savedUser.getId(),
                    savedUser.getName(),
                    savedUser.getEmail(),
                    savedUser.getRole(),
                    savedUser.getPhone(),
                    savedUser.getAddress()
            );
        } finally {
            MDC.clear();
        }
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        MDC.put("userEmail", email);

        try {
            log.info("Processing login authentication attempt for email: {}", email);

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        log.warn("[AUTH FAILED] User not found for email: {}", email);
                        return new IllegalArgumentException("Invalid email or password");
                    });

            MDC.put("userRole", user.getRole().name());

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                log.warn("[AUTH FAILED] Password mismatch for email: {}", email);
                throw new IllegalArgumentException("Invalid email or password");
            }

            log.info("Authentication successful for user: {} (Role: {})", user.getEmail(), user.getRole());
            String token = jwtUtil.generateToken(user);

            return new AuthResponse(
                    token,
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getPhone(),
                    user.getAddress()
            );
        } finally {
            MDC.clear();
        }
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public java.util.List<java.util.Map<String, String>> getDemoCredentialsFromDb() {
        java.util.List<User> allUsers = userRepository.findAll();
        java.util.List<java.util.Map<String, String>> credentials = new java.util.ArrayList<>();

        // Find first Admin in MySQL
        allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_ADMIN)
                .findFirst()
                .ifPresent(admin -> {
                    java.util.Map<String, String> m = new java.util.HashMap<>();
                    m.put("role", "ROLE_ADMIN");
                    m.put("label", "Administrator");
                    m.put("name", admin.getName());
                    m.put("email", admin.getEmail());
                    m.put("password", "admin123");
                    credentials.add(m);
                });

        // Find first Customer in MySQL
        allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_CUSTOMER)
                .findFirst()
                .ifPresent(customer -> {
                    java.util.Map<String, String> m = new java.util.HashMap<>();
                    m.put("role", "ROLE_CUSTOMER");
                    m.put("label", "Customer");
                    m.put("name", customer.getName());
                    m.put("email", customer.getEmail());
                    m.put("password", "customer123");
                    credentials.add(m);
                });

        return credentials;
    }
}

