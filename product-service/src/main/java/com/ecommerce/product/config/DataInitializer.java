package com.ecommerce.product.config;

import com.ecommerce.product.model.Product;
import com.ecommerce.product.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(ProductRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                List<Product> sampleProducts = List.of(
                    new Product(
                        "Sony WH-1000XM5 Wireless Headphones",
                        "Industry-leading active noise cancellation with two processors and 8 microphones. Crystal clear hands-free calling and 30-hour battery life.",
                        29990.00,
                        25,
                        "Electronics",
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
                        4.8
                    ),
                    new Product(
                        "Apple MacBook Pro 14\" M3",
                        "Powerful Apple M3 Pro chip, Liquid Retina XDR display, up to 18 hours of battery life, and 18GB unified memory for heavy professional workloads.",
                        169900.00,
                        15,
                        "Computers",
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
                        4.9
                    ),
                    new Product(
                        "Logitech MX Master 3S Mouse",
                        "Quiet Clicks, 8K DPI track-on-glass optical sensor, MagSpeed electromagnetic scroll wheel, and ergonomic thumb rest for all-day comfort.",
                        8995.00,
                        40,
                        "Accessories",
                        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
                        4.7
                    ),
                    new Product(
                        "Samsung 49\" Odyssey OLED G9",
                        "Dual QHD curved gaming monitor with 240Hz refresh rate, 0.03ms response time, DisplayHDR True Black 400, and Neo Quantum Processor Pro.",
                        129999.00,
                        10,
                        "Electronics",
                        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
                        4.6
                    ),
                    new Product(
                        "Keychron Q1 Pro Mechanical Keyboard",
                        "Custom wireless mechanical keyboard with full CNC aluminum body, hot-swappable switches, PBT keycaps, and QMK/VIA support.",
                        16499.00,
                        30,
                        "Accessories",
                        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
                        4.8
                    ),
                    new Product(
                        "Garmin Fenix 7 Pro Sapphire Solar",
                        "Multisport GPS smartwatch with Power Sapphire solar charging lens, built-in LED flashlight, endurance score, and titanium bezel.",
                        74990.00,
                        18,
                        "Wearables",
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
                        4.7
                    ),
                    new Product(
                        "Sonos Era 300 Smart Speaker",
                        "Spatial audio speaker featuring 6 drivers for immersive Dolby Atmos music playback, Apple AirPlay 2, WiFi 6, and Bluetooth connectivity.",
                        39999.00,
                        22,
                        "Audio",
                        "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
                        4.5
                    ),
                    new Product(
                        "Peak Design Everyday Backpack 20L",
                        "Award-winning everyday carry and camera gear backpack with weatherproof UltraZip, FlexFold internal dividers, and dedicated 15\" laptop sleeve.",
                        24500.00,
                        35,
                        "Accessories",
                        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
                        4.9
                    )
                );
                repository.saveAll(sampleProducts);
                System.out.println(">>> Sample product catalog seeded with INR prices in MySQL! Total products: " + sampleProducts.size());
            }
        };
    }
}
