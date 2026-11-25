package com.cpt202.appointment_system.Common;

import java.util.Locale;
import com.cpt202.appointment_system.Models.Appointment;

public final class AppointmentStatus {
    private AppointmentStatus() {}
    public static String normalize(String value) {
        if (value == null) return "pending";
        switch (value.toLowerCase(Locale.ROOT)) {
            case "accepted": return "confirmed";
            case "finished": return "completed";
            default: return value.toLowerCase(Locale.ROOT);
        }
    }
    public static String current(Appointment a) {
        String status = normalize(a.getStatus());
        return "pending".equals(status) && a.getStartTime() != null
                && a.getStartTime().getTime() <= System.currentTimeMillis() ? "expired" : status;
    }
    public static boolean open(Appointment a) {
        return "pending".equals(current(a)) || "confirmed".equals(current(a));
    }
}
