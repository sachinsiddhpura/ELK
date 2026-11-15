package com.ecommerce.order.repository;

import com.ecommerce.order.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByOrderDateDesc();

    List<Order> findByCustomerEmailIgnoreCaseOrderByOrderDateDesc(String customerEmail);

    Optional<Order> findByOrderNumber(String orderNumber);
}

