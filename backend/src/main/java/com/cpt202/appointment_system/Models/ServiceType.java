package com.cpt202.appointment_system.Models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import lombok.Data;

@Data
@Entity
public class ServiceType {
    @Column(length = 128, unique = true)
    private String firebaseKey;
    private Boolean active = true;
    private String category;
    @Column(length = 2048)
    private String imageURL;
    @Column(length = 500)
    private String description;
    private Boolean veterinary = false;
    private Integer discountPercent = 0;
    private java.time.LocalDate promotionStart;
    private java.time.LocalDate promotionEnd;
    @javax.persistence.ElementCollection
    @javax.persistence.CollectionTable(name = "service_package_item", joinColumns = @JoinColumn(name = "sid"))
    @Column(name = "included_sid")
    private java.util.Set<Integer> packageItems = new java.util.HashSet<>();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "int(7)")
    private Integer sid;

    @Column(length = 60, nullable = true)
    private String serviceName;
    
    @Column(columnDefinition = "int(7)", nullable = true)
    private Integer serviceTime;

    @Column(columnDefinition = "int(7)", nullable = true)
    private Integer basicPrice;

    public ServiceType(String serviceName, int serviceTime, int basicPrice) {
        this.serviceName = serviceName;
        this.serviceTime = serviceTime;
        this.basicPrice = basicPrice;
    }

    public ServiceType() {
    }

    public ServiceType(Integer sid) {
        this.sid = sid;
    }

    

}
