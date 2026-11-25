package com.cpt202.appointment_system.Models;

import javax.persistence.*;
import java.time.Instant;
import lombok.Data;

@Entity
@Data
public class PasswordReset {
    @Id private Integer userId;
    private String codeHash;
    private Instant expiresAt;
    private Instant sentAt;
    private int attempts;
}
