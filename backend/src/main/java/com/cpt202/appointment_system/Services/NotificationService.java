package com.cpt202.appointment_system.Services;

import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cpt202.appointment_system.Common.*;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.NotificationRepo;

@Service
public class NotificationService {
    private final NotificationRepo notifications;
    public NotificationService(NotificationRepo notifications) { this.notifications = notifications; }
    public void changed(Appointment a) {
        Notification n = new Notification();
        n.setUserId(a.getUser().getUid()); n.setAppointmentId(a.getAid());
        n.setStatus(AppointmentStatus.current(a));
        n.setMessage("Lịch " + (a.getReference() == null ? a.getAid() : a.getReference()) + ": " + n.getStatus());
        n.setCreatedAt(Instant.now()); notifications.save(n);
    }
    public List<Notification> list(User user) { return notifications.findByUserIdOrderByCreatedAtDesc(user.getUid()); }
    @Transactional
    public Notification read(User user, Long id) {
        Notification n = notifications.findById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy thông báo."));
        if (!user.getUid().equals(n.getUserId())) throw new ApiException(404, "Không tìm thấy thông báo.");
        if (n.getReadAt() == null) n.setReadAt(Instant.now());
        return n;
    }
}
