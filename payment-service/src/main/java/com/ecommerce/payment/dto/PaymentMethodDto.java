package com.ecommerce.payment.dto;

import com.ecommerce.payment.model.PaymentMethod;

public class PaymentMethodDto {

    private PaymentMethod method;
    private String name;
    private String description;
    private String badge;
    private String gatewayProvider;
    private boolean instantSettlement;

    public PaymentMethodDto() {}

    public PaymentMethodDto(PaymentMethod method, String name, String description,
                            String badge, String gatewayProvider, boolean instantSettlement) {
        this.method = method;
        this.name = name;
        this.description = description;
        this.badge = badge;
        this.gatewayProvider = gatewayProvider;
        this.instantSettlement = instantSettlement;
    }

    public PaymentMethod getMethod() {
        return method;
    }

    public void setMethod(PaymentMethod method) {
        this.method = method;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBadge() {
        return badge;
    }

    public void setBadge(String badge) {
        this.badge = badge;
    }

    public String getGatewayProvider() {
        return gatewayProvider;
    }

    public void setGatewayProvider(String gatewayProvider) {
        this.gatewayProvider = gatewayProvider;
    }

    public boolean isInstantSettlement() {
        return instantSettlement;
    }

    public void setInstantSettlement(boolean instantSettlement) {
        this.instantSettlement = instantSettlement;
    }
}

