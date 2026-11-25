package com.cpt202.appointment_system.Repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cpt202.appointment_system.Models.Notification;

public interface NotificationRepo extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
