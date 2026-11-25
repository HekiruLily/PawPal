package com.cpt202.appointment_system.Common;

import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import com.cpt202.appointment_system.Models.*;

/** Stable mobile fields, without exposing account credentials or live prices as booked prices. */
public final class ApiViews {
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private ApiViews() {}
    public static Map<String, Object> user(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("uid", u.getUid()); m.put("username", u.getUsername());
        m.put("firebaseUid", u.getFirebaseUid());
        m.put("name", u.getName() == null ? u.getUsername() : u.getName());
        m.put("email", u.getEmail()); m.put("phoneNumber", u.getPhoneNumber());
        m.put("address", u.getAddress()); m.put("imageURL", u.getImageURL());
        m.put("role", Integer.valueOf(1).equals(u.getType()) ? "manager" : "customer");
        return m;
    }
    public static Map<String, Object> pet(Pet p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("pid", p.getPid()); m.put("ownerId", p.getUser().getUid()); m.put("name", p.getName());
        m.put("species", p.getType()); m.put("breed", p.getBreed()); m.put("age", p.getAge());
        m.put("size", p.getSize()); m.put("gender", p.getGender()); m.put("notes", p.getNotes());
        m.put("imageURL", p.getImageURL()); return m;
    }
    public static Map<String, Object> appointment(Appointment a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("aid", a.getAid()); m.put("reference", a.getReference() == null ? "PP-" + a.getAid() : a.getReference());
        m.put("version", a.getVersion()); m.put("userId", a.getUser().getUid());
        m.put("customerName", a.getUser().getName() == null ? a.getUser().getUsername() : a.getUser().getName());
        m.put("petId", a.getPet().getPid()); m.put("petName", a.getPetName() == null ? a.getPet().getName() : a.getPetName());
        String firebaseKey = a.getPet().getFirebaseKey();
        m.put("firebasePetId", firebaseKey == null ? null : firebaseKey.substring(firebaseKey.indexOf('/') + 1));
        m.put("groomerId", a.getGroomer().getGid()); m.put("groomerName", a.getGroomer().getName());
        m.put("status", AppointmentStatus.current(a));
        m.put("startTime", a.getStartTime().toInstant().atZone(ZONE).toOffsetDateTime());
        m.put("finishTime", a.getFinishTime() == null ? null : a.getFinishTime().toInstant().atZone(ZONE).toOffsetDateTime());
        m.put("durationMinutes", a.getDurationMinutes()); m.put("subtotal", a.getSubtotal());
        m.put("discount", a.getDiscount() == null ? 0L : a.getDiscount()); m.put("totalPrice", a.getTotalprice());
        m.put("items", items(a)); m.put("editCount", a.getEditCount() == null ? 0 : a.getEditCount());
        return m;
    }
    public static List<AppointmentItem> items(Appointment a) {
        if (a.getItems() != null && !a.getItems().isEmpty()) return a.getItems();
        AppointmentItem item = new AppointmentItem();
        item.setServiceId(a.getServiceType().getSid()); item.setServiceName(a.getServiceType().getServiceName());
        item.setPrice(a.getTotalprice() == null ? 0 : a.getTotalprice().longValue());
        item.setDuration(a.getFinishTime() == null ? 0 : (int) ((a.getFinishTime().getTime() - a.getStartTime().getTime()) / 60000));
        item.setVeterinary(Boolean.TRUE.equals(a.getServiceType().getVeterinary()) || "Sức khỏe".equals(a.getServiceType().getCategory()));
        return Collections.singletonList(item);
    }
    public static String serviceNames(Appointment a) { return items(a).stream().map(AppointmentItem::getServiceName).collect(Collectors.joining(", ")); }
}
