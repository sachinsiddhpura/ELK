package com.ecommerce.auth.config;

import com.ecommerce.auth.model.Role;
import com.ecommerce.auth.model.User;
import com.ecommerce.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("Checking default Admin and Customer user credentials in MySQL ecommerce_user_db...");

        // 1. Seed Admin Account
        if (!userRepository.existsByEmail("admin@shopwave.com")) {
            User admin = new User(
                    "System Administrator",
                    "admin@shopwave.com",
                    passwordEncoder.encode("admin123"),
                    Role.ROLE_ADMIN,
                    "+91 99999 88888",
                    "ShopWave HQ, Cyber City, Gurugram, Haryana - 122002"
            );
            userRepository.save(admin);
            log.info("Seeded default Administrator account: admin@shopwave.com / admin123 (ROLE_ADMIN)");
        } else {
            log.info("Admin account admin@shopwave.com already exists in MySQL");
        }

        // 2. Seed Customer Account
        if (!userRepository.existsByEmail("customer@shopwave.com")) {
            User customer = new User(
                    "Demo Customer",
                    "customer@shopwave.com",
                    passwordEncoder.encode("customer123"),
                    Role.ROLE_CUSTOMER,
                    "+91 98765 43210",
                    "Flat 302, Prestige Palms, Whitefield, Bengaluru, Karnataka - 560066"
            );
            userRepository.save(customer);
            log.info("Seeded default Customer account: customer@shopwave.com / customer123 (ROLE_CUSTOMER)");
        } else {
            log.info("Customer account customer@shopwave.com already exists in MySQL");
        }
    }
}

