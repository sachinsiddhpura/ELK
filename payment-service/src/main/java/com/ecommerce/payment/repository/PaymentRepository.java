package com.ecommerce.payment.repository;

import com.ecommerce.payment.model.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionId(String transactionId);

    List<PaymentTransaction> findByOrderNumberOrderByTransactionDateDesc(String orderNumber);

    List<PaymentTransaction> findByCustomerEmailOrderByTransactionDateDesc(String customerEmail);

    List<PaymentTransaction> findAllByOrderByTransactionDateDesc();
}

