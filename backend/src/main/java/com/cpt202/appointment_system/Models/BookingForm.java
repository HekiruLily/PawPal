package com.cpt202.appointment_system.Models;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.Data;

/** Client choices only. Ownership, totals, status and snapshots come from the server. */
@Data
public class BookingForm {
    private String firebasePetId;
    private List<String> firebaseServiceIds;
    private Integer petId;
    private List<Integer> serviceIds;
    private Integer groomerId;
    private OffsetDateTime startTime;
    private Long expectedTotal;
    private Long expectedDiscount;
    private Integer expectedDuration;
    private Long version;
}
