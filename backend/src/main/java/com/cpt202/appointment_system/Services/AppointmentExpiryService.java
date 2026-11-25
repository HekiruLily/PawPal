package com.cpt202.appointment_system.Services;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cpt202.appointment_system.Common.AppointmentStatus;
import com.cpt202.appointment_system.Models.Appointment;
import com.cpt202.appointment_system.Repositories.*;

@Service
@EnableScheduling
@ConditionalOnProperty(name = "pawpal.expiry.enabled", havingValue = "true", matchIfMissing = true)
public class AppointmentExpiryService {
    private final GroomerRepo groomers;
    private final AppointmentRepo appointments;
    private final NotificationService notifications;
    public AppointmentExpiryService(GroomerRepo groomers, AppointmentRepo appointments, NotificationService notifications) {
        this.groomers = groomers; this.appointments = appointments; this.notifications = notifications;
    }
    @Scheduled(fixedDelayString = "${pawpal.expiry.interval:60000}", initialDelayString = "${pawpal.expiry.interval:60000}")
    @Transactional
    public void expire() {
        groomers.lockSchedule();
        for (Appointment a : appointments.findAll()) {
            if ("pending".equals(AppointmentStatus.normalize(a.getStatus())) && "expired".equals(AppointmentStatus.current(a))) {
                a.setStatus("expired"); notifications.changed(a);
            }
        }
    }
}
