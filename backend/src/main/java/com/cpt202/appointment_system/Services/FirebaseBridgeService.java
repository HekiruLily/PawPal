package com.cpt202.appointment_system.Services;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.JsonNode;
import com.cpt202.appointment_system.Common.ApiException;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;
import static com.cpt202.appointment_system.Common.ApiException.require;

/** Firebase is the master catalog; SQL rows are links/snapshots for booking, not a second editable catalog. */
@Service
public class FirebaseBridgeService {
    public static final String REQUEST_USER = "pawpal.firebase.user";
    private final FirebaseService firebase;
    private final UserRepo users;
    private final PetRepo pets;
    private final ServiceTypeRepo services;
    public FirebaseBridgeService(FirebaseService firebase, UserRepo users, PetRepo pets, ServiceTypeRepo services) {
        this.firebase = firebase; this.users = users; this.pets = pets; this.services = services;
    }
    @Transactional
    public User authenticate(String token) {
        FirebaseService.Identity identity = firebase.verify(token);
        String uid = FirebaseService.key(identity.uid());
        boolean manager = "manager".equals(firebase.read("roles/" + uid).asText());
        JsonNode profile = firebase.read("users/" + uid);
        User user = users.findByFirebaseUid(uid).orElse(null);
        if (user == null) {
            // Never merge by email alone: an existing SQL account must be linked by an administrator.
            if (users.existsByEmail(identity.email().toLowerCase(Locale.ROOT)))
                throw new ApiException(409, "Email đã có tài khoản SQL chưa liên kết. Cần quản trị viên gắn Firebase UID.");
            user = new User("fb_" + UUID.nameUUIDFromBytes(uid.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString().replace("-", ""),
                    "!FIREBASE_ONLY!", 0);
            user.setFirebaseUid(uid); user.setRegistrationTime(Timestamp.from(Instant.now()));
        }
        user.setEmail(identity.email().toLowerCase(Locale.ROOT)); user.setType(manager ? 1 : 0);
        user.setName(profile.path("name").asText(identity.email()));
        user.setPhoneNumber(profile.path("phoneNumber").asText(null)); user.setAddress(profile.path("address").asText(null));
        return users.saveAndFlush(user);
    }
    public void selection(User user, BookingForm form) {
        if (user.getFirebaseUid() == null) {
            require(form.getFirebasePetId() == null && form.getFirebaseServiceIds() == null, "Đăng nhập Firebase để dùng hồ sơ này."); return;
        }
        String uid = FirebaseService.key(user.getFirebaseUid()), petId = FirebaseService.key(form.getFirebasePetId());
        require(form.getFirebaseServiceIds() != null && !form.getFirebaseServiceIds().isEmpty() && form.getFirebaseServiceIds().size() <= 20
                && new HashSet<>(form.getFirebaseServiceIds()).size() == form.getFirebaseServiceIds().size(), "Chọn từ 1 đến 20 dịch vụ, không trùng.");
        JsonNode source = firebase.read("pets/" + uid + "/" + petId);
        if (source.isNull() || !uid.equals(source.path("ownerId").asText())) throw new ApiException(404, "Không tìm thấy thú cưng của bạn.");
        Pet pet = pets.findByFirebaseKey(uid + "/" + petId).orElseGet(Pet::new);
        pet.setFirebaseKey(uid + "/" + petId); pet.setUser(user); pet.setDeleted(false);
        pet.setName(text(source, "name", 40)); pet.setType(text(source, "species", 50)); pet.setSize(text(source, "size", 10));
        pet.setBreed(source.path("breed").asText("")); pet.setAge(source.path("age").asInt()); pet.setGender(source.path("gender").asText(""));
        pet.setNotes(source.path("notes").asText("")); pet.setImageURL(source.path("imageURL").asText(""));
        form.setPetId(pets.saveAndFlush(pet).getPid());
        List<Integer> ids = new ArrayList<>();
        for (String id : form.getFirebaseServiceIds().stream().sorted().toList()) {
            FirebaseService.key(id);
            JsonNode data = firebase.read("services/" + id);
            require(!data.isNull() && data.path("active").asBoolean(false), "Dịch vụ không tồn tại hoặc đã tạm ngưng.");
            ServiceType service = services.findByFirebaseKey(id).orElseGet(ServiceType::new);
            service.setFirebaseKey(id); service.setServiceName(text(data, "name", 60)); service.setCategory(text(data, "category", 40));
            service.setBasicPrice(integer(data, "price", 1, 999999999)); service.setServiceTime(integer(data, "duration", 5, 600));
            service.setActive(true); service.setDescription(data.path("description").asText("")); service.setImageURL(data.path("imageURL").asText(""));
            service.setVeterinary("Sức khỏe".equals(service.getCategory()));
            service.setDiscountPercent(data.has("discountPercent") ? integer(data, "discountPercent", 0, 100) : 0);
            try {
                service.setPromotionStart(data.has("promotionStart") ? LocalDate.parse(data.get("promotionStart").asText()) : null);
                service.setPromotionEnd(data.has("promotionEnd") ? LocalDate.parse(data.get("promotionEnd").asText()) : null);
            } catch (java.time.format.DateTimeParseException e) { throw new ApiException(400, "Ngày ưu đãi không hợp lệ."); }
            ids.add(services.saveAndFlush(service).getSid());
        }
        form.setServiceIds(ids);
    }
    private String text(JsonNode data, String field, int max) {
        JsonNode value = data.path(field); require(value.isTextual() && !value.asText().isBlank() && value.asText().length() <= max, "Dữ liệu Firebase không hợp lệ: " + field);
        return value.asText();
    }
    private int integer(JsonNode data, String field, int min, int max) {
        JsonNode value = data.path(field); require(value.isIntegralNumber() && value.canConvertToInt() && value.intValue() >= min && value.intValue() <= max, "Dữ liệu Firebase không hợp lệ: " + field);
        return value.intValue();
    }
}
