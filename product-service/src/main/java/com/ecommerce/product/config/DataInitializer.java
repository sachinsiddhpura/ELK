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
                    new Product("Sony WH-1000XM5 Wireless Headphones", "Industry-leading active noise cancellation with two processors and 8 microphones. Crystal clear hands-free calling and 30-hour battery life.", 29990.00, 25, "Electronics", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", 4.8),
                    new Product("Apple MacBook Pro 14\" M3", "Powerful Apple M3 Pro chip, Liquid Retina XDR display, up to 18 hours of battery life, and 18GB unified memory for heavy professional workloads.", 169900.00, 15, "Computers", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80", 4.9),
                    new Product("Logitech MX Master 3S Mouse", "Quiet Clicks, 8K DPI track-on-glass optical sensor, MagSpeed electromagnetic scroll wheel, and ergonomic thumb rest for all-day comfort.", 8995.00, 40, "Accessories", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80", 4.7),
                    new Product("Samsung 49\" Odyssey OLED G9", "Dual QHD curved gaming monitor with 240Hz refresh rate, 0.03ms response time, DisplayHDR True Black 400, and Neo Quantum Processor Pro.", 129999.00, 10, "Electronics", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80", 4.6),
                    new Product("Keychron Q1 Pro Mechanical Keyboard", "Custom wireless mechanical keyboard with full CNC aluminum body, hot-swappable switches, PBT keycaps, and QMK/VIA support.", 16499.00, 30, "Accessories", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80", 4.8),
                    new Product("Garmin Fenix 7 Pro Sapphire Solar", "Multisport GPS smartwatch with Power Sapphire solar charging lens, built-in LED flashlight, endurance score, and titanium bezel.", 74990.00, 18, "Wearables", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", 4.7),
                    new Product("Sonos Era 300 Smart Speaker", "Spatial audio speaker featuring 6 drivers for immersive Dolby Atmos music playback, Apple AirPlay 2, WiFi 6, and Bluetooth connectivity.", 39999.00, 22, "Audio", "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80", 4.5),
                    new Product("Peak Design Everyday Backpack 20L", "Award-winning everyday carry and camera gear backpack with weatherproof UltraZip, FlexFold internal dividers, and dedicated 15\" laptop sleeve.", 24500.00, 35, "Accessories", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80", 4.9),
                    new Product("Apple iPhone 15 Pro Max 256GB", "Titanium design with A17 Pro chip, customizable Action button, and 48MP camera system with 5x optical zoom.", 148900.00, 20, "Electronics", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80", 4.9),
                    new Product("Sony PlayStation 5 Slim Console", "Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback, and all-new 1TB storage.", 54990.00, 16, "Gaming", "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80", 4.8),
                    new Product("Dell UltraSharp 32\" 4K USB-C Hub Monitor", "Brilliant color and contrast with IPS Black technology, 98% DCI-P3 color gamut, and 90W power delivery.", 84500.00, 12, "Computers", "https://images.unsplash.com/photo-1547119957-637f8679db1e?w=600&auto=format&fit=crop&q=80", 4.7),
                    new Product("Bose QuietComfort Ultra Headphones", "Breakthrough spatial audio for more immersive listening, world-class noise cancellation, and custom audio calibration.", 35900.00, 28, "Audio", "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80", 4.7),
                    new Product("Canon EOS R6 Mark II Mirrorless Camera", "24.2 MP full-frame sensor, 40 fps electronic continuous shooting, Dual Pixel CMOS AF II, and 4K 60p video.", 215995.00, 8, "Electronics", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80", 4.9),
                    new Product("Herman Miller Aeron Ergonomic Office Chair", "The benchmark for ergonomic seating with 8Z Pellicle suspension, PostureFit SL sacral support, and fully adjustable arms.", 135000.00, 14, "Office", "https://images.unsplash.com/photo-1580481077195-c3a821078e88?w=600&auto=format&fit=crop&q=80", 4.9),
                    new Product("Samsung Galaxy S24 Ultra 5G (512GB)", "Titanium frame, built-in S Pen, Galaxy AI capabilities, 200MP camera, and Snapdragon 8 Gen 3 for Galaxy.", 139999.00, 18, "Electronics", "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80", 4.8),
                    new Product("Apple iPad Air 11\" M2 Liquid Retina", "Supercharged by the blazing-fast M2 chip, 11-inch Liquid Retina display, Touch ID, and support for Apple Pencil Pro.", 59900.00, 22, "Computers", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80", 4.8),
                    new Product("Marshall Stanmore III Wireless Home Speaker", "Legendary Marshall rock sound with re-engineered soundstage, Bluetooth 5.2, 3.5mm AUX, and classic brass control knobs.", 31999.00, 25, "Audio", "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80", 4.6),
                    new Product("DJI Mini 4 Pro Drone with RC 2 Screen Remote", "Sub-249g ultra-lightweight drone, Omnidirectional obstacle sensing, 4K/60fps HDR true vertical shooting, and 20km transmission.", 98900.00, 10, "Electronics", "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80", 4.9),
                    new Product("Apple Watch Ultra 2 GPS + Cellular 49mm", "Rugged titanium case, precision dual-frequency GPS, up to 72 hours of battery life, and high-altitude dive computer.", 89900.00, 15, "Wearables", "https://images.unsplash.com/photo-1509741102003-ca64bfe5f069?w=600&auto=format&fit=crop&q=80", 4.9),
                    new Product("Razer DeathAdder V3 Pro Wireless Gaming Mouse", "Ultra-lightweight 63g ergonomic esports mouse with Focus Pro 30K Optical Sensor and Gen-3 Optical Switches.", 13999.00, 32, "Gaming", "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80", 4.7)
                );
                repository.saveAll(sampleProducts);
                System.out.println(">>> Sample product catalog seeded with 20 INR products in MySQL!");
            }
        };
    }
}
