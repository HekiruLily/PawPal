package com.cpt202.appointment_system.Services;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import javax.persistence.EntityManager;
import javax.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cpt202.appointment_system.Common.*;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;
import static com.cpt202.appointment_system.Common.ApiException.require;

@Service
@Transactional(readOnly = true)
public class BookingService {
    @org.springframework.beans.factory.annotation.Autowired private FirebaseBridgeService firebase;
    @org.springframework.beans.factory.annotation.Autowired private FirebaseBookingService firebaseBookings;
    private final AppointmentRepo appointments;
    private final PetRepo pets;
    private final GroomerRepo groomers;
    private final ServiceTypeRepo services;
    private final NotificationService notifications;
    private final EntityManager entities;
    public BookingService(AppointmentRepo appointments, PetRepo pets, GroomerRepo groomers,
            ServiceTypeRepo services, NotificationService notifications, EntityManager entities) {
        this.appointments = appointments; this.pets = pets; this.groomers = groomers;
        this.services = services; this.notifications = notifications; this.entities = entities;
    }
    @Transactional
    public Map<String, Object> quote(User user, BookingForm form) {
        groomers.lockSchedule(); firebase.selection(user, form);
        ownedPet(user, form.getPetId(), false);
        List<AppointmentItem> items = selection(form.getServiceIds(), false);
        return totals(items);
    }
    @Transactional
    public List<Map<String, Object>> slots(User user, LocalDate date, BookingForm form) {
        groomers.lockSchedule(); firebase.selection(user, form);
        require(date != null && !date.isBefore(LocalDate.now(ApiViews.ZONE)), "Ngày phải từ hôm nay trở đi.");
        ownedPet(user, form.getPetId(), false);
        List<AppointmentItem> items = selection(form.getServiceIds(), false);
        int duration = duration(items);
        List<Appointment> existing = appointments.findAll();
        List<Groomer> staff = groomers.findAll();
        List<Map<String, Object>> out = new ArrayList<>();
        for (int minute = 480; minute + duration <= 1080; minute += 30) {
            Instant start = date.atStartOfDay(ApiViews.ZONE).plusMinutes(minute).toInstant();
            if (!start.isAfter(Instant.now())) continue;
            Groomer chosen = available(staff, existing, form.getGroomerId(), form.getPetId(), start,
                    start.plusSeconds(duration * 60L), items.get(0).isVeterinary(), null);
            if (chosen != null) out.add(Map.of("startTime", start.atZone(ApiViews.ZONE).toOffsetDateTime(), "groomerId", chosen.getGid()));
        }
        return out;
    }
    @Transactional
    public Map<String, Object> create(User user, BookingForm form) {
        require(Integer.valueOf(0).equals(user.getType()), "Chỉ khách hàng được đặt lịch.");
        require(user.getFirebaseUid() == null || user.getPhoneNumber() != null && user.getPhoneNumber().matches("[+0-9() .-]{7,20}"),
                "Cập nhật số điện thoại trong hồ sơ trước khi đặt lịch.");
        List<Groomer> staff = lockStaff();
        String firebaseLock = firebaseBookings.reserve(user, form);
        firebase.selection(user, form);
        Pet pet = ownedPet(user, form.getPetId(), true);
        List<AppointmentItem> items = selection(form.getServiceIds(), true);
        checkQuote(form, items);
        Instant start = validTime(form.getStartTime(), duration(items));
        Instant end = start.plusSeconds(duration(items) * 60L);
        List<Appointment> existing = appointments.lockOverlapping(Timestamp.from(start), Timestamp.from(end));
        Groomer groomer = available(staff, existing, form.getGroomerId(), pet.getPid(), start, end, items.get(0).isVeterinary(), null);
        if (groomer == null) throw new ApiException(409, "Khung giờ không còn nhân viên phù hợp hoặc thú cưng đã có lịch.");
        Appointment a = new Appointment();
        a.setFirebaseLockKey(firebaseLock);
        a.setReference("PP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT));
        a.setCreateTime(Timestamp.from(Instant.now())); a.setUser(user); a.setPet(pet); a.setPetName(pet.getName());
        a.setGroomer(groomer); a.setStartTime(Timestamp.from(start)); a.setFinishTime(Timestamp.from(end));
        applyItems(a, items); a.setStatus("pending");
        appointments.saveAndFlush(a); notifications.changed(a);
        return ApiViews.appointment(a);
    }
    @Transactional
    public Map<String, Object> edit(User user, Integer id, BookingForm form) {
        List<Groomer> staff = lockStaff();
        Appointment a = locked(id);
        owned(user, a); checkVersion(a, form.getVersion());
        require("pending".equals(AppointmentStatus.current(a)), "Chỉ sửa lịch đang chờ xác nhận.");
        require(a.getEditCount() == null || a.getEditCount() < 1, "Mỗi lịch chỉ được sửa một lần.");
        String firebaseLock = firebaseBookings.reserve(user, form);
        firebase.selection(user, form);
        firebaseBookings.releaseAfterCommit(a.getFirebaseLockKey()); a.setFirebaseLockKey(firebaseLock);
        Pet pet = ownedPet(user, form.getPetId(), true);
        List<AppointmentItem> items = selection(form.getServiceIds(), true);
        checkQuote(form, items);
        Instant start = validTime(form.getStartTime(), duration(items));
        Instant end = start.plusSeconds(duration(items) * 60L);
        Groomer g = available(staff, appointments.lockOverlapping(Timestamp.from(start), Timestamp.from(end)),
                form.getGroomerId(), pet.getPid(), start, end, items.get(0).isVeterinary(), a.getAid());
        if (g == null) throw new ApiException(409, "Khung giờ không còn trống.");
        a.setPet(pet); a.setPetName(pet.getName()); a.setGroomer(g);
        a.setStartTime(Timestamp.from(start)); a.setFinishTime(Timestamp.from(end)); applyItems(a, items);
        a.setEditCount(1); appointments.flush(); notifications.changed(a); return ApiViews.appointment(a);
    }
    @Transactional
    public Map<String, Object> cancel(User user, Integer id, Long version) {
        groomers.lockSchedule();
        Appointment a = locked(id); owned(user, a); checkVersion(a, version);
        String status = AppointmentStatus.current(a);
        require(AppointmentStatus.open(a) && a.getStartTime().toInstant().isAfter(Instant.now()), "Lịch không còn được tự hủy.");
        require("pending".equals(status) || a.getStartTime().toInstant().isAfter(Instant.now().plusSeconds(86400)), "Lịch đã xác nhận cần báo hủy trước 24 giờ.");
        a.setStatus("cancelled"); a.setCancelTime(Timestamp.from(Instant.now()));
        firebaseBookings.releaseAfterCommit(a.getFirebaseLockKey());
        appointments.flush(); notifications.changed(a); return ApiViews.appointment(a);
    }
    @Transactional
    public Map<String, Object> transition(User manager, Integer id, String target, Integer groomerId, Long version) {
        require(Integer.valueOf(1).equals(manager.getType()), "Cần quyền quản lý.");
        List<Groomer> staff = lockStaff();
        Appointment a = locked(id); checkVersion(a, version);
        String current = AppointmentStatus.current(a);
        String next = target == null ? current : AppointmentStatus.normalize(target);
        boolean assignOnly = target == null && groomerId != null;
        require((assignOnly && ("pending".equals(current) || "confirmed".equals(current)))
                || ("pending".equals(current) && Set.of("confirmed", "rejected").contains(next))
                || ("confirmed".equals(current) && Set.of("completed", "cancelled").contains(next)), "Không được chuyển trạng thái lịch như yêu cầu.");
        if (assignOnly || "confirmed".equals(next)) {
            require(a.getStartTime().toInstant().isAfter(Instant.now()), "Không phân công hoặc xác nhận lịch đã bắt đầu.");
            Integer picked = groomerId == null ? a.getGroomer().getGid() : groomerId;
            Groomer g = available(staff, appointments.lockOverlapping(a.getStartTime(), a.getFinishTime()), picked,
                    a.getPet().getPid(), a.getStartTime().toInstant(), a.getFinishTime().toInstant(), ApiViews.items(a).get(0).isVeterinary(), a.getAid());
            if (g == null) throw new ApiException(409, "Nhân viên không phù hợp hoặc khung giờ bị trùng.");
            a.setGroomer(g);
        }
        if ("completed".equals(next)) require(a.getFinishTime() != null && !a.getFinishTime().toInstant().isAfter(Instant.now()), "Chỉ hoàn thành sau giờ kết thúc.");
        if ("cancelled".equals(next)) a.setCancelTime(Timestamp.from(Instant.now()));
        a.setStatus(next);
        if (!AppointmentStatus.open(a)) firebaseBookings.releaseAfterCommit(a.getFirebaseLockKey());
        appointments.flush(); notifications.changed(a); return ApiViews.appointment(a);
    }
    public List<Map<String, Object>> list(User user, boolean manager, String status, String query) {
        String q = com.cpt202.appointment_system.Utils.TextUtil.search(query);
        return appointments.findAll().stream().filter(a -> manager || a.getUser().getUid().equals(user.getUid()))
                .filter(a -> status == null || status.isBlank() || "all".equals(status) || AppointmentStatus.current(a).equals(AppointmentStatus.normalize(status)))
                .filter(a -> com.cpt202.appointment_system.Utils.TextUtil.search(String.valueOf(a.getAid()) + " " + a.getReference() + " " + a.getUser().getUsername() + " " + a.getUser().getName() + " "
                        + (a.getPetName() == null ? a.getPet().getName() : a.getPetName()) + " " + ApiViews.serviceNames(a)).contains(q))
                .sorted(Comparator.comparing(Appointment::getStartTime).reversed()).map(ApiViews::appointment).collect(Collectors.toList());
    }
    public Map<String, Object> detail(User user, Integer id) {
        Appointment a = appointments.findById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy lịch hẹn."));
        if (!Integer.valueOf(1).equals(user.getType())) owned(user, a);
        return ApiViews.appointment(a);
    }
    private List<Groomer> lockStaff() {
        List<Groomer> staff = groomers.lockSchedule();
        staff.forEach(g -> entities.refresh(g, LockModeType.PESSIMISTIC_WRITE));
        return staff;
    }
    private Appointment locked(Integer id) {
        Appointment a = entities.find(Appointment.class, id, LockModeType.PESSIMISTIC_WRITE);
        if (a == null) throw new ApiException(404, "Không tìm thấy lịch hẹn.");
        entities.refresh(a, LockModeType.PESSIMISTIC_WRITE); return a;
    }
    private void owned(User user, Appointment a) {
        if (!user.getUid().equals(a.getUser().getUid())) throw new ApiException(404, "Không tìm thấy lịch hẹn.");
    }
    private Pet ownedPet(User user, Integer id, boolean lock) {
        require(id != null, "Chọn thú cưng.");
        Pet pet = (lock ? pets.lockById(id) : pets.findById(id)).orElseThrow(() -> new ApiException(404, "Không tìm thấy thú cưng."));
        if (!user.getUid().equals(pet.getUser().getUid()) || Boolean.TRUE.equals(pet.getDeleted())
                || "".equals(pet.getType())) throw new ApiException(404, "Không tìm thấy thú cưng.");
        return pet;
    }
    private List<AppointmentItem> selection(List<Integer> ids, boolean lock) {
        require(ids != null && !ids.isEmpty() && ids.size() <= 20 && ids.stream().allMatch(Objects::nonNull), "Chọn từ 1 đến 20 dịch vụ.");
        require(new HashSet<>(ids).size() == ids.size(), "Không chọn trùng dịch vụ.");
        List<ServiceType> selected = new ArrayList<>();
        for (Integer id : ids.stream().sorted().collect(Collectors.toList())) {
            ServiceType s = lock ? entities.find(ServiceType.class, id, LockModeType.PESSIMISTIC_READ) : services.findById(id).orElse(null);
            require(s != null && !Boolean.FALSE.equals(s.getActive()), "Dịch vụ không tồn tại hoặc đã tạm ngưng.");
            if (lock) entities.refresh(s, LockModeType.PESSIMISTIC_READ);
            require(!Boolean.FALSE.equals(s.getActive()), "Dịch vụ đã tạm ngưng.");
            selected.add(s);
        }
        Set<Integer> included = new HashSet<>();
        List<AppointmentItem> items = new ArrayList<>();
        for (ServiceType s : selected) {
            Set<Integer> covered = new HashSet<>(); covered.add(s.getSid()); covered.addAll(s.getPackageItems());
            require(Collections.disjoint(included, covered), "Dịch vụ đã có trong gói trọn gói."); included.addAll(covered);
            require(s.getBasicPrice() != null && s.getBasicPrice() > 0 && s.getServiceTime() != null
                    && s.getServiceTime() >= 5 && s.getServiceTime() <= 600, "Giá hoặc thời lượng dịch vụ không hợp lệ.");
            AppointmentItem item = new AppointmentItem(); item.setServiceId(s.getSid()); item.setServiceName(s.getServiceName());
            item.setFirebaseServiceId(s.getFirebaseKey());
            item.setPrice(s.getBasicPrice()); item.setDuration(s.getServiceTime());
            item.setVeterinary(Boolean.TRUE.equals(s.getVeterinary()) || "Sức khỏe".equals(s.getCategory()));
            LocalDate today = LocalDate.now(ApiViews.ZONE);
            int percent = s.getDiscountPercent() == null ? 0 : s.getDiscountPercent();
            if (percent > 0 && s.getPromotionStart() != null && s.getPromotionEnd() != null
                    && !today.isBefore(s.getPromotionStart()) && !today.isAfter(s.getPromotionEnd())) item.setDiscount(item.getPrice() * percent / 100);
            items.add(item);
        }
        require(items.stream().allMatch(i -> i.isVeterinary() == items.get(0).isVeterinary()), "Đặt khám thú y ở một lịch riêng.");
        require(duration(items) <= 600, "Tổng thời lượng không được vượt 600 phút.");
        return items;
    }
    private Map<String, Object> totals(List<AppointmentItem> items) {
        long subtotal = items.stream().mapToLong(AppointmentItem::getPrice).sum();
        long discount = items.stream().mapToLong(AppointmentItem::getDiscount).sum();
        return Map.of("items", items, "subtotal", subtotal, "discount", discount, "totalPrice", subtotal - discount, "durationMinutes", duration(items));
    }
    private int duration(List<AppointmentItem> items) { return items.stream().mapToInt(AppointmentItem::getDuration).sum(); }
    private void checkQuote(BookingForm form, List<AppointmentItem> items) {
        require(form.getExpectedTotal() != null && form.getExpectedDuration() != null, "Cần gửi expectedTotal và expectedDuration từ báo giá đã xem.");
        Map<String,Object> current = totals(items);
        if (!form.getExpectedTotal().equals(current.get("totalPrice")) || form.getExpectedDuration() != duration(items)
                || form.getExpectedDiscount() != null && !form.getExpectedDiscount().equals(current.get("discount")))
            throw new ApiException(409, "Giá, thời lượng hoặc ưu đãi vừa thay đổi. Vui lòng xem lại báo giá.");
    }
    private Instant validTime(OffsetDateTime value, int duration) {
        require(value != null, "Chọn giờ bắt đầu có múi giờ.");
        ZonedDateTime local = value.atZoneSameInstant(ApiViews.ZONE);
        require(local.getSecond() == 0 && local.getNano() == 0 && local.getMinute() % 30 == 0, "Khung bắt đầu cách nhau 30 phút.");
        require(local.getHour() >= 8 && !local.plusMinutes(duration).toLocalDate().isAfter(local.toLocalDate())
                && !local.plusMinutes(duration).toLocalTime().isAfter(LocalTime.of(18, 0)), "Giờ hoạt động từ 08:00 đến 18:00.");
        require(value.toInstant().isAfter(Instant.now()), "Lịch phải ở tương lai."); return value.toInstant();
    }
    private Groomer available(List<Groomer> staff, List<Appointment> existing, Integer picked, Integer petId,
            Instant start, Instant end, boolean veterinary, Integer skip) {
        List<Appointment> busy = existing.stream().filter(a -> !Objects.equals(a.getAid(), skip) && AppointmentStatus.open(a)
                && a.getStartTime().toInstant().isBefore(end) && a.getFinishTime().toInstant().isAfter(start)).collect(Collectors.toList());
        if (busy.stream().anyMatch(a -> a.getPet().getPid().equals(petId))) return null;
        return staff.stream().filter(g -> picked == null || picked.equals(g.getGid())).filter(g -> !Boolean.FALSE.equals(g.getAcceptingAppointments()))
                .filter(g -> (Boolean.TRUE.equals(g.getVeterinary()) || "Bác sĩ thú y".equalsIgnoreCase(g.getTitle())) == veterinary)
                .sorted(Comparator.comparing(Groomer::getGid)).filter(g -> busy.stream().noneMatch(a -> a.getGroomer().getGid().equals(g.getGid()))).findFirst().orElse(null);
    }
    private void applyItems(Appointment a, List<AppointmentItem> items) {
        a.getItems().clear(); a.getItems().addAll(items);
        a.setServiceType(services.getReferenceById(items.get(0).getServiceId()));
        Map<String, Object> t = totals(items); a.setSubtotal((Long)t.get("subtotal")); a.setDiscount((Long)t.get("discount"));
        a.setTotalprice(((Long)t.get("totalPrice")).doubleValue()); a.setDurationMinutes(duration(items));
    }
    private void checkVersion(Appointment a, Long version) {
        if (version == null || !Objects.equals(a.getVersion(), version)) throw new ApiException(409, "Lịch vừa thay đổi. Hãy tải lại phiên bản mới nhất.");
    }
}
