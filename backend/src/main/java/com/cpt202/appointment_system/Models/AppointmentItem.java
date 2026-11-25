package com.cpt202.appointment_system.Models;

import javax.persistence.*;
import lombok.Data;

@Data
@Embeddable
public class AppointmentItem {
    private String firebaseServiceId;
    private Integer serviceId;
    @Column(length = 60)
    private String serviceName;
    private long price;
    private long discount;
    private int duration;
    private boolean veterinary;
}
