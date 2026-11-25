package com.cpt202.appointment_system.Models;

import java.time.Instant;
import javax.persistence.*;
import lombok.Data;

@Data
@Entity
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer userId;
    private Integer appointmentId;
    private String status;
    private String message;
    private Instant createdAt;
    private Instant readAt;
}
