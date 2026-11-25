package com.cpt202.appointment_system.Services;

import java.time.Instant;
import java.util.*;
import org.slf4j.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.cpt202.appointment_system.Common.AppointmentStatus;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;

/** Conservative distributed lock: lock Firebase before reading a pet; unlock only after SQL commit. */
@Service
public class FirebaseBookingService {
    private static final Logger log = LoggerFactory.getLogger(FirebaseBookingService.class);
    private final FirebaseService firebase;
    private final AppointmentRepo appointments;
    private final GroomerRepo groomers;
    @org.springframework.beans.factory.annotation.Value("${pawpal.firebase.enabled:false}") private boolean enabled;
    @org.springframework.beans.factory.annotation.Value("${pawpal.firebase.booking-scope:legacy}") private String bookingScope = "legacy";
    public FirebaseBookingService(FirebaseService firebase, AppointmentRepo appointments, GroomerRepo groomers) {
        this.firebase = firebase; this.appointments = appointments; this.groomers = groomers;
    }
    public String reserve(User user, BookingForm form) {
        if (user.getFirebaseUid() == null) return null;
        String path = "petBookings/" + FirebaseService.key(user.getFirebaseUid()) + "/" + FirebaseService.key(form.getFirebasePetId())
                + "/" + lockPrefix() + UUID.randomUUID().toString().replace("-", "");
        // Register first: even a timed-out PUT might have reached Firebase.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) { if (status != STATUS_COMMITTED) removeSafely(path); }
        });
        firebase.write(path, Map.of("createdAt", Instant.now().toEpochMilli()));
        return path;
    }
    public void releaseAfterCommit(String path) {
        if (path == null) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { removeSafely(path); }
        });
    }
    private void removeSafely(String path) {
        try { firebase.remove(path); }
        catch (RuntimeException e) { log.warn("Firebase booking guard cleanup deferred; scheduled reconciliation will retry."); }
    }
    private String lockPrefix() {
        if ("legacy".equals(bookingScope)) return "spring_";
        if (bookingScope == null || !bookingScope.matches("[A-Za-z0-9-]{1,64}"))
            throw new com.cpt202.appointment_system.Common.ApiException(503, "Cấu hình booking scope của backend không hợp lệ.");
        return "spring_" + bookingScope + "_";
    }
    private boolean ownsReservation(String key) {
        String prefix = lockPrefix();
        return key.startsWith(prefix) && (!"legacy".equals(bookingScope) || !key.substring(prefix.length()).contains("_"));
    }
    /** SQL and RTDB cannot share a transaction. Retry terminal guards and recover abandoned reservations. */
    @Scheduled(fixedDelayString = "${pawpal.firebase.reconcile-interval:60000}", initialDelayString = "${pawpal.firebase.reconcile-interval:60000}")
    @Transactional
    public void reconcile() {
        if (!enabled) return;
        groomers.lockSchedule(); // serialize with create/edit/status so live reservations cannot be removed
        List<Appointment> linked = appointments.findAll().stream().filter(a -> a.getFirebaseLockKey() != null).toList();
        Set<String> open = new HashSet<>();
        for (Appointment a : linked) {
            if (AppointmentStatus.open(a)) open.add(a.getFirebaseLockKey());
            else removeSafely(a.getFirebaseLockKey());
        }
        try {
            JsonNode root = firebase.read("petBookings");
            root.fields().forEachRemaining(owner -> owner.getValue().fields().forEachRemaining(pet -> pet.getValue().fields().forEachRemaining(lock -> {
                String path = "petBookings/" + owner.getKey() + "/" + pet.getKey() + "/" + lock.getKey();
                long created = lock.getValue().path("createdAt").asLong(Long.MAX_VALUE);
                if (ownsReservation(lock.getKey()) && !open.contains(path) && created < Instant.now().minusSeconds(600).toEpochMilli()) removeSafely(path);
            })));
        } catch (RuntimeException e) { log.warn("Firebase booking guard reconciliation unavailable; guards remain locked."); }
    }
}
