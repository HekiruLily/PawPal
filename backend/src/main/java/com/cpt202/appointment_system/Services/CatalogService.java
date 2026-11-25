package com.cpt202.appointment_system.Services;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import javax.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cpt202.appointment_system.Common.*;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;
import static com.cpt202.appointment_system.Common.ApiException.require;

@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final ServiceTypeRepo services;
    private final GroomerRepo groomers;
    private final PetRepo pets;
    private final UserRepo users;
    private final AppointmentRepo appointments;
    private final EntityManager entities;
    public CatalogService(ServiceTypeRepo services, GroomerRepo groomers, PetRepo pets, UserRepo users, AppointmentRepo appointments, EntityManager entities) {
        this.services = services; this.groomers = groomers; this.pets = pets; this.users = users; this.appointments = appointments; this.entities = entities;
    }
    public long petCount() { return pets.countByDeletedFalseOrDeletedIsNull(); }

    public List<ServiceType> services(boolean manager, String query) {
        String q = com.cpt202.appointment_system.Utils.TextUtil.search(query);
        return services.findAll().stream().filter(s -> manager || !Boolean.FALSE.equals(s.getActive()))
                .filter(s -> com.cpt202.appointment_system.Utils.TextUtil.search(s.getServiceName() + " " + s.getCategory()).contains(q)).collect(Collectors.toList());
    }
    @Transactional
    public ServiceType saveService(Integer id, ServiceType input) {
        groomers.lockSchedule();
        ServiceType s = id == null ? new ServiceType() : services.findById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy dịch vụ."));
        require(s.getFirebaseKey() == null, "Dịch vụ liên kết phải được sửa tại danh mục Firebase.");
        require(input.getServiceName() != null && !input.getServiceName().isBlank() && input.getServiceName().length() <= 50, "Tên dịch vụ từ 1 đến 50 ký tự.");
        require(input.getBasicPrice() != null && input.getBasicPrice() > 0 && input.getBasicPrice() <= 999999999, "Giá là số nguyên từ 1 đến 999999999 VND.");
        require(input.getServiceTime() != null && input.getServiceTime() >= 5 && input.getServiceTime() <= 600, "Thời lượng từ 5 đến 600 phút.");
        int percent = input.getDiscountPercent() == null ? 0 : input.getDiscountPercent();
        require(percent >= 0 && percent < 100, "Giảm giá từ 0 đến 99 phần trăm.");
        require(percent == 0 || (input.getPromotionStart() != null && input.getPromotionEnd() != null
                && !input.getPromotionStart().isAfter(input.getPromotionEnd())), "Ưu đãi cần khoảng ngày hợp lệ.");
        Set<Integer> included = input.getPackageItems() == null ? new HashSet<>() : new HashSet<>(input.getPackageItems());
        require(included.stream().allMatch(Objects::nonNull) && (id == null || !included.contains(id)), "Gói không được chứa chính nó.");
        boolean vet = Boolean.TRUE.equals(input.getVeterinary()) || "Sức khỏe".equals(input.getCategory());
        for (Integer childId : included) {
            ServiceType child = services.findById(childId).orElseThrow(() -> new ApiException(400, "Dịch vụ trong gói không tồn tại."));
            require(child.getPackageItems().isEmpty(), "Không lồng gói dịch vụ.");
            require(vet == (Boolean.TRUE.equals(child.getVeterinary()) || "Sức khỏe".equals(child.getCategory())), "Gói không được trộn khám thú y với chăm sóc.");
        }
        for (ServiceType parent : services.findAll()) {
            if (id != null && parent.getPackageItems().contains(id)) require(vet == (Boolean.TRUE.equals(parent.getVeterinary()) || "Sức khỏe".equals(parent.getCategory())), "Chuyên môn phải khớp gói đang chứa dịch vụ này.");
        }
        // Do not turn an existing package member into a nested package.
        require(included.isEmpty() || services.findAll().stream().noneMatch(parent -> id != null && parent.getPackageItems().contains(id)), "Dịch vụ đang nằm trong gói khác.");
        s.setServiceName(input.getServiceName().trim()); s.setBasicPrice(input.getBasicPrice()); s.setServiceTime(input.getServiceTime());
        s.setActive(!Boolean.FALSE.equals(input.getActive())); s.setCategory(input.getCategory()); s.setVeterinary(vet);
        require(input.getDescription() == null || input.getDescription().length() <= 500, "Mô tả tối đa 500 ký tự.");
        s.setDescription(input.getDescription()); s.setImageURL(image(input.getImageURL()));
        s.setDiscountPercent(percent); s.setPromotionStart(input.getPromotionStart()); s.setPromotionEnd(input.getPromotionEnd());
        s.getPackageItems().clear(); s.getPackageItems().addAll(included); return services.save(s);
    }
    @Transactional
    public ServiceType serviceActive(Integer id, boolean active) {
        groomers.lockSchedule();
        ServiceType s = services.findById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy dịch vụ."));
        require(s.getFirebaseKey() == null, "Dịch vụ liên kết phải được sửa tại danh mục Firebase.");
        s.setActive(active); return s;
    }
    public List<Map<String, Object>> groomers(boolean manager, String query) {
        String q = com.cpt202.appointment_system.Utils.TextUtil.search(query);
        List<Appointment> all = appointments.findAll();
        return groomers.findAll().stream().filter(g -> manager || !Boolean.FALSE.equals(g.getAcceptingAppointments()))
                .filter(g -> com.cpt202.appointment_system.Utils.TextUtil.search(g.getName() + " " + g.getTitle() + " " + g.getSpecialties()).contains(q)).map(g -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("gid", g.getGid()); m.put("name", g.getName()); m.put("gender", g.getGender()); m.put("rank", g.getRank());
            m.put("imageURL", g.getImageURL()); m.put("title", g.getTitle()); m.put("experienceYears", g.getExperienceYears());
            m.put("specialties", g.getSpecialties()); m.put("veterinary", Boolean.TRUE.equals(g.getVeterinary()) || "Bác sĩ thú y".equalsIgnoreCase(g.getTitle()));
            String description = g.getDescription() == null ? "" : g.getDescription();
            String address = g.getAddress();
            if (address == null) address = Arrays.stream(description.split("\\r?\\n")).filter(l -> l.startsWith("Địa chỉ:")).map(l -> l.substring(7).trim()).findFirst().orElse("");
            m.put("address", manager ? address : ""); m.put("phoneNumber", manager ? g.getPhoneNumber() : "");
            m.put("description", Arrays.stream(description.split("\\r?\\n")).filter(l -> !l.startsWith("Địa chỉ:")).collect(Collectors.joining("\n")));
            m.put("acceptingAppointments", !Boolean.FALSE.equals(g.getAcceptingAppointments()));
            m.put("upcomingAppointmentCount", all.stream().filter(a -> a.getGroomer().getGid().equals(g.getGid()) && AppointmentStatus.open(a)
                    && a.getStartTime().toInstant().isAfter(Instant.now())).count()); return m;
        }).collect(Collectors.toList());
    }
    @Transactional
    public Groomer saveGroomer(Integer id, Groomer input) {
        groomers.lockSchedule();
        Groomer g = id == null ? new Groomer() : groomers.findById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy nhân viên."));
        require(input.getName() != null && !input.getName().isBlank() && input.getName().length() <= 50, "Tên nhân viên từ 1 đến 50 ký tự.");
        require(input.getGender() != null && !input.getGender().isBlank() && input.getGender().length() <= 20, "Chọn giới tính.");
        require(input.getExperienceYears() == null || input.getExperienceYears() >= 0 && input.getExperienceYears() <= 80, "Kinh nghiệm từ 0 đến 80 năm.");
        String phone = input.getPhoneNumber() == null || input.getPhoneNumber().isBlank() ? null : input.getPhoneNumber().trim();
        require(phone == null || phone.matches("[0-9+(). -]{7,20}"), "Số điện thoại từ 7 đến 20 ký tự.");
        require(input.getRank() == null || input.getRank() >= 0 && input.getRank() <= 100, "Hạng từ 0 đến 100.");
        require(input.getAddress() == null || input.getAddress().length() <= 160, "Địa chỉ tối đa 160 ký tự.");
        require(input.getDescription() == null || input.getDescription().length() <= 255, "Mô tả tối đa 255 ký tự.");
        require(input.getTitle() == null || input.getTitle().length() <= 50, "Chức danh tối đa 50 ký tự.");
        require(input.getSpecialties() == null || input.getSpecialties().length() <= 500, "Chuyên môn tối đa 500 ký tự.");
        g.setName(input.getName().trim()); g.setGender(input.getGender()); g.setPhoneNumber(phone);
        g.setAddress(input.getAddress()); g.setDescription(input.getDescription()); g.setImageURL(image(input.getImageURL()));
        g.setRank(input.getRank() == null ? (g.getRank() == null ? 0 : g.getRank()) : input.getRank());
        g.setTitle(input.getTitle()); g.setExperienceYears(input.getExperienceYears()); g.setSpecialties(input.getSpecialties());
        g.setVeterinary(input.getVeterinary());
        if (input.getAcceptingAppointments() != null) g.setAcceptingAppointments(input.getAcceptingAppointments());
        else if (g.getAcceptingAppointments() == null) g.setAcceptingAppointments(true);
        return groomers.save(g);
    }
    @Transactional
    public Groomer accepting(Integer id, boolean value) {
        groomers.lockSchedule();
        Groomer g = groomers.findById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy nhân viên."));
        g.setAcceptingAppointments(value); return g;
    }
    @Transactional
    public void deleteGroomer(Integer id) {
        groomers.lockSchedule();
        require(appointments.findByGid(id).isEmpty(), "Nhân viên đã có lịch sử. Hãy tạm ngưng thay vì xóa.");
        Groomer g = groomers.findById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy nhân viên.")); groomers.delete(g);
    }
    public List<Map<String, Object>> pets(User user) {
        return pets.findByUser(user).stream().filter(p -> !Boolean.TRUE.equals(p.getDeleted()) && !"".equals(p.getType())).map(ApiViews::pet).collect(Collectors.toList());
    }
    @Transactional
    public Map<String, Object> savePet(User user, Integer id, Pet input) {
        groomers.lockSchedule();
        Pet p = id == null ? new Pet() : ownedPet(user, id);
        require(user.getFirebaseUid() == null && p.getFirebaseKey() == null, "Hồ sơ liên kết phải được sửa tại Firebase.");
        require(input.getName() != null && !input.getName().isBlank() && input.getName().length() <= 40, "Tên thú cưng từ 1 đến 40 ký tự.");
        require(Set.of("Dog", "Cat", "Other", "Chó", "Mèo", "Khác").contains(Objects.toString(input.getType(), "")), "Loài không hợp lệ.");
        require(Set.of("Small", "Medium", "Large", "Nhỏ", "Vừa", "Lớn").contains(Objects.toString(input.getSize(), "")), "Kích cỡ không hợp lệ.");
        require(input.getAge() != null && input.getAge() >= 0 && input.getAge() <= 30, "Tuổi từ 0 đến 30.");
        require(input.getBreed() == null || input.getBreed().length() <= 40, "Giống tối đa 40 ký tự.");
        require(input.getNotes() == null || input.getNotes().length() <= 300, "Ghi chú tối đa 300 ký tự.");
        p.setUser(user); p.setName(input.getName().trim()); p.setType(input.getType()); p.setSize(input.getSize());
        p.setAge(input.getAge()); p.setBreed(input.getBreed()); p.setGender(input.getGender()); p.setNotes(input.getNotes());
        p.setImageURL(image(input.getImageURL())); p.setDeleted(false); return ApiViews.pet(pets.save(p));
    }
    @Transactional
    public void deletePet(User user, Integer id) {
        groomers.lockSchedule(); Pet p = ownedPet(user, id);
        require(p.getFirebaseKey() == null, "Hồ sơ liên kết phải được xóa tại Firebase.");
        require(appointments.findByPid(id).stream().noneMatch(a -> AppointmentStatus.open(a) && a.getFinishTime().toInstant().isAfter(Instant.now())), "Thú cưng đang có lịch. Hãy hủy lịch trước.");
        p.setDeleted(true);
    }
    private Pet ownedPet(User user, Integer id) {
        Pet p = pets.lockById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy thú cưng."));
        if (!p.getUser().getUid().equals(user.getUid()) || Boolean.TRUE.equals(p.getDeleted())) throw new ApiException(404, "Không tìm thấy thú cưng.");
        return p;
    }
    @Transactional
    public Map<String, Object> profile(User user, User input) {
        User u = users.findByUid(user.getUid());
        require(input.getName() != null && !input.getName().isBlank() && input.getName().length() <= 60, "Họ tên từ 1 đến 60 ký tự.");
        require(input.getPhoneNumber() != null && input.getPhoneNumber().matches("[+0-9() .-]{7,20}"), "Số điện thoại không hợp lệ.");
        require(input.getAddress() == null || input.getAddress().length() <= 160, "Địa chỉ tối đa 160 ký tự.");
        u.setName(input.getName().trim()); u.setAddress(input.getAddress()); u.setPhoneNumber(input.getPhoneNumber());
        if (input.getImageURL() != null) u.setImageURL(image(input.getImageURL())); return ApiViews.user(u);
    }
    private String image(String value) {
        if (value == null || value.isBlank()) return null;
        require(value == null || value.length() <= 255 && (value.startsWith("/uploads/") || value.startsWith("/assets/") || value.startsWith("https://")), "Ảnh phải là URL đã upload hoặc HTTPS.");
        return value;
    }
}
