package com.cpt202.appointment_system.Integration_Test;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.cpt202.appointment_system.Common.*;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;
import com.cpt202.appointment_system.Services.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class BookingIntegrationTest {
    @Autowired BookingService booking;
    @Autowired com.cpt202.appointment_system.Config.LegacyDataMigration migration;
    @Autowired AppointmentExpiryService expiry;
    @Autowired CatalogService catalog;
    @Autowired ReportService reports;
    @Autowired LoginService login;
    @Autowired AppointmentRepo appointments;
    @Autowired GroomerRepo groomers;
    @Autowired ServiceTypeRepo services;
    @Autowired PetRepo pets;
    @Autowired UserRepo users;
    @Autowired NotificationRepo notifications;
    @Autowired PasswordResetRepo resets;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    User customer, other, manager;
    Pet pet, otherPet;
    Groomer groomer;
    ServiceType bath, nails;
    @BeforeEach void setup() {
        notifications.deleteAll(); resets.deleteAll(); appointments.deleteAll(); pets.deleteAll(); services.deleteAll(); groomers.deleteAll(); users.deleteAll();
        customer = users.save(new User("customer", "password", 0)); other = users.save(new User("other", "password", 0)); manager = users.save(new User("manager", "password", 1));
        pet = pet(customer, "Bơ"); otherPet = pet(other, "Miu");
        Groomer g = new Groomer(); g.setName("Nhân viên"); g.setGender("Nữ"); g.setRank(1); g.setAcceptingAppointments(true); groomer = groomers.save(g);
        bath = services.save(new ServiceType("Tắm", 60, 180000)); nails = services.save(new ServiceType("Cắt móng", 30, 50000));
    }
    private Pet pet(User user, String name) { Pet p = new Pet(); p.setName(name); p.setUser(user); p.setType("Chó"); p.setSize("Vừa"); p.setAge(3); return pets.save(p); }
    private BookingForm form(Pet p, ServiceType... selected) {
        BookingForm f = new BookingForm(); f.setPetId(p.getPid()); f.setServiceIds(Arrays.stream(selected).map(ServiceType::getSid).collect(java.util.stream.Collectors.toList()));
        f.setGroomerId(groomer.getGid()); f.setStartTime(LocalDate.now(ApiViews.ZONE).plusDays(2).atTime(10, 0).atZone(ApiViews.ZONE).toOffsetDateTime());
        User owner = p.getUser(); Map<String,Object> q = booking.quote(owner, f); f.setExpectedTotal((Long)q.get("totalPrice")); f.setExpectedDuration((Integer)q.get("durationMinutes")); return f;
    }
    private MockHttpSession session(User u) { MockHttpSession s = new MockHttpSession(); s.setAttribute("user", u.getUsername()); s.setAttribute("role", u.getType()); return s; }
    @Test void multiServiceBookingAndSnapshotArePersistent() {
        Map<String,Object> created = booking.create(customer, form(pet, bath, nails));
        assertEquals(230000.0, created.get("totalPrice")); assertEquals(90, created.get("durationMinutes"));
        bath.setBasicPrice(999999); bath.setServiceName("Giá mới"); services.save(bath);
        Map<String,Object> loaded = booking.detail(customer, (Integer)created.get("aid"));
        assertEquals(230000.0, loaded.get("totalPrice"));
        assertEquals(1, booking.list(customer, false, null, "bo").size());
        @SuppressWarnings("unchecked") List<AppointmentItem> items = (List<AppointmentItem>)loaded.get("items");
        assertEquals("Tắm", items.get(0).getServiceName()); assertEquals(2, items.size()); assertEquals(1, notifications.count());
    }
    @Test void cannotReadBookCancelOrEditAnotherCustomersPetAndAppointment() throws Exception {
        BookingForm foreign = form(otherPet, bath);
        assertEquals(404, assertThrows(ApiException.class, () -> booking.create(customer, foreign)).getStatus());
        Map<String,Object> created = booking.create(other, foreign); Integer aid = (Integer)created.get("aid"); Long version = (Long)created.get("version");
        assertEquals(404, assertThrows(ApiException.class, () -> booking.cancel(customer, aid, version)).getStatus());
        mvc.perform(get("/Appointment/api/appointments/"+aid).session(session(customer))).andExpect(status().isNotFound());
        mvc.perform(get("/maintain/api/appointments").session(session(customer))).andExpect(status().isForbidden());
        mvc.perform(get("/maintain/api/appointments")).andExpect(status().isUnauthorized());
        assertThrows(ApiException.class, () -> catalog.deletePet(customer, otherPet.getPid()));
    }
    @Test void pausedStaffServicesVetAndPackageConflictsAreRejected() {
        BookingForm f = form(pet, bath);
        catalog.accepting(groomer.getGid(), false); assertThrows(ApiException.class, () -> booking.create(customer, f));
        catalog.accepting(groomer.getGid(), true); catalog.serviceActive(bath.getSid(), false); assertThrows(ApiException.class, () -> booking.create(customer, f));
        catalog.serviceActive(bath.getSid(), true);
        nails.setVeterinary(true); services.save(nails);
        f.setServiceIds(List.of(bath.getSid(), nails.getSid())); assertThrows(ApiException.class, () -> booking.quote(customer, f));
        nails.setVeterinary(false); nails.getPackageItems().add(bath.getSid()); services.save(nails);
        assertThrows(ApiException.class, () -> booking.quote(customer, f));
    }
    @Test void validatesFutureOpeningHoursAndQuoteChanges() {
        BookingForm f = form(pet, bath); f.setStartTime(f.getStartTime().withHour(7)); assertThrows(ApiException.class, () -> booking.create(customer, f));
        f.setStartTime(f.getStartTime().withHour(17).withMinute(30)); assertThrows(ApiException.class, () -> booking.create(customer, f));
        f.setStartTime(f.getStartTime().withHour(10).withMinute(15)); assertThrows(ApiException.class, () -> booking.create(customer, f));
        f.setStartTime(f.getStartTime().withMinute(0)); bath.setBasicPrice(200000); services.save(bath);
        assertEquals(409, assertThrows(ApiException.class, () -> booking.create(customer, f)).getStatus()); assertEquals(0, appointments.count());
    }
    @Test void promotionAppliedOnlyWithinItsWindow() {
        bath.setDiscountPercent(15); bath.setPromotionStart(LocalDate.now(ApiViews.ZONE)); bath.setPromotionEnd(LocalDate.now(ApiViews.ZONE).plusDays(6)); services.save(bath);
        BookingForm f = form(pet, bath); assertEquals(153000L, f.getExpectedTotal());
        assertEquals(27000L, booking.create(customer, f).get("discount"));
    }
    @Test void simultaneousRequestsForSameSlotHaveOnlyOneWinner() throws Exception {
        BookingForm a = form(pet, bath), b = form(otherPet, bath);
        ExecutorService pool = Executors.newFixedThreadPool(2); CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Boolean>> results = new ArrayList<>();
            results.add(pool.submit(() -> attempt(customer, a, start))); results.add(pool.submit(() -> attempt(other, b, start)));
            start.countDown(); int successes = 0;
            for (Future<Boolean> result : results) if (result.get(20, TimeUnit.SECONDS)) successes++;
            assertEquals(1, successes); assertEquals(1, appointments.count());
        } finally { pool.shutdownNow(); }
    }
    private boolean attempt(User user, BookingForm f, CountDownLatch start) throws Exception { start.await(); try { booking.create(user, f); return true; } catch (ApiException e) { assertEquals(409, e.getStatus()); return false; } }
    @Test void cancelledAppointmentsReleaseSlotsAndPetCannotOverlapWithAnotherStaff() {
        BookingForm f = form(pet, bath); Map<String,Object> a = booking.create(customer, f);
        Groomer second = new Groomer(); second.setName("Khác"); second.setGender("Nam"); second.setRank(1); second.setAcceptingAppointments(true); second = groomers.save(second);
        f.setGroomerId(second.getGid()); assertThrows(ApiException.class, () -> booking.create(customer, f));
        booking.cancel(customer, (Integer)a.get("aid"), (Long)a.get("version")); assertDoesNotThrow(() -> booking.create(customer, f));
    }
    @Test void transitionAndVersionRulesAnd24HourCancellation() {
        Map<String,Object> a = booking.create(customer, form(pet, bath)); Integer id = (Integer)a.get("aid");
        assertThrows(ApiException.class, () -> booking.transition(manager, id, "completed", null, (Long)a.get("version")));
        Map<String,Object> confirmed = booking.transition(manager, id, "confirmed", null, (Long)a.get("version"));
        assertThrows(ApiException.class, () -> booking.cancel(customer, id, (Long)a.get("version")));
        assertThrows(ApiException.class, () -> booking.transition(manager, id, "completed", null, (Long)confirmed.get("version")));
        Appointment row = appointments.findByAid(id); row.setStartTime(Timestamp.from(Instant.now().plusSeconds(3600))); row.setFinishTime(Timestamp.from(Instant.now().plusSeconds(7200))); appointments.saveAndFlush(row);
        Long version = appointments.findByAid(id).getVersion();
        assertThrows(ApiException.class, () -> booking.cancel(customer, id, version));
    }
    @Test void legacyStatusesAndCsvUseSameRevenueAndSnapshotNames() {
        Map<String,Object> a = booking.create(customer, form(pet, bath)); Appointment row = appointments.findByAid((Integer)a.get("aid"));
        row.setStatus("Finished"); appointments.save(row);
        Map<String,Object> b = booking.create(other, form(otherPet, nails)); Appointment cancelled = appointments.findByAid((Integer)b.get("aid")); cancelled.setStatus("Cancelled"); appointments.save(cancelled);
        Map<String,Object> report = reports.report("all", null, null); assertEquals(180000L, report.get("revenue"));
        assertTrue(reports.csv("all", null, null).contains("completed")); assertTrue(reports.csv("all", null, null).contains("Tắm"));
        assertEquals("completed", booking.detail(customer, row.getAid()).get("status"));
    }
    @Test void apiLoginReturnsRealRoleAndNeverPassword() throws Exception {
        mvc.perform(post("/appointment-system/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"customer\",\"password\":\"password\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.role").value("customer")).andExpect(jsonPath("$.data.password").doesNotExist());
        assertTrue(users.findByUid(customer.getUid()).getPassword().startsWith("$2"));
        mvc.perform(post("/appointment-system/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"customer\",\"password\":\"wrong\"}"))
            .andExpect(status().isUnauthorized());
    }
    @Test void editsExactlyOnceAndNotificationsAreOwned() {
        BookingForm f = form(pet, bath); Map<String,Object> a = booking.create(customer, f); Integer id = (Integer)a.get("aid");
        f.setVersion((Long)a.get("version")); f.setStartTime(f.getStartTime().plusMinutes(30)); Map<String,Object> changed = booking.edit(customer, id, f);
        f.setVersion((Long)changed.get("version")); assertThrows(ApiException.class, () -> booking.edit(customer, id, f));
        Notification n = notifications.findAll().get(0); assertEquals(customer.getUid(), n.getUserId());
    }
    @Test void newCatalogServiceAndPetFieldsCanBeSaved() {
        ServiceType s = new ServiceType("Khám", 30, 100000); s.setVeterinary(true); s.setCategory("Sức khỏe");
        assertNotNull(catalog.saveService(null, s).getSid());
        Pet p = new Pet(); p.setName("Lu"); p.setType("Chó"); p.setSize("Nhỏ"); p.setAge(2); p.setBreed("Poodle"); p.setNotes("Sợ máy sấy");
        assertEquals("Poodle", catalog.savePet(customer, null, p).get("breed"));
    }
    @Test void slotsRespectTotalDurationAndPetSchedule() {
        BookingForm f = form(pet, bath, nails);
        LocalDate date = f.getStartTime().toLocalDate();
        List<Map<String,Object>> slots = booking.slots(customer, date, f);
        assertEquals(18, slots.size()); // 08:00 through 16:30, inclusive.
        booking.create(customer, f);
        assertTrue(booking.slots(customer, date, f).stream().noneMatch(slot -> slot.get("startTime").equals(f.getStartTime())));
    }
    @Test void notificationReadIsOwnedAndPetDeletionPreservesBookedName() throws Exception {
        Map<String,Object> a = booking.create(customer, form(pet, bath));
        Notification n = notifications.findAll().get(0);
        mvc.perform(post("/customer/api/notifications/"+n.getId()+"/read").session(session(other))).andExpect(status().isNotFound());
        mvc.perform(post("/customer/api/notifications/"+n.getId()+"/read").session(session(customer))).andExpect(status().isOk());
        assertNotNull(notifications.findById(n.getId()).get().getReadAt());
        assertThrows(ApiException.class, () -> catalog.deletePet(customer, pet.getPid()));
        booking.cancel(customer, (Integer)a.get("aid"), (Long)a.get("version")); catalog.deletePet(customer, pet.getPid());
        assertEquals("Bơ", booking.detail(customer, (Integer)a.get("aid")).get("petName")); assertTrue(catalog.pets(customer).isEmpty());
    }
    @Test void managerCanUpdateGroomerByPathWithoutCreatingDuplicateAndAddressDoesNotRepeat() throws Exception {
        Groomer edited = new Groomer(); edited.setName("Tên mới"); edited.setGender("Nữ"); edited.setAddress("Hà Nội"); edited.setDescription("Ghi chú"); edited.setRank(1);
        mvc.perform(put("/maintain/api/groomers/"+groomer.getGid()).session(session(manager)).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(edited)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.gid").value(groomer.getGid()));
        assertEquals(1, groomers.count());
        mvc.perform(get("/maintain/api/groomers").session(session(manager))).andExpect(jsonPath("$[0].address").value("Hà Nội")).andExpect(jsonPath("$[0].description").value("Ghi chú"));
        mvc.perform(post("/maintain/api/groomers/999999/accepting").param("accepting","false").session(session(manager))).andExpect(status().isNotFound());
    }
    @Test void uploadsAcceptDecodedImageAndRejectNonImage() throws Exception {
        org.springframework.mock.web.MockMultipartFile invalid = new org.springframework.mock.web.MockMultipartFile("file","fake.png","image/png","invalid".getBytes());
        mvc.perform(multipart("/customer/api/uploads").file(invalid).session(session(manager))).andExpect(status().isBadRequest());
        java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(new java.awt.image.BufferedImage(1,1,java.awt.image.BufferedImage.TYPE_INT_RGB), "png", bytes);
        org.springframework.mock.web.MockMultipartFile valid = new org.springframework.mock.web.MockMultipartFile("file","image.png","image/png",bytes.toByteArray());
        mvc.perform(multipart("/customer/api/uploads").file(valid).session(session(manager))).andExpect(status().isOk()).andExpect(jsonPath("$.data.imageURL").value(org.hamcrest.Matchers.startsWith("/uploads/")));
    }
    @Test void csvEscapesCommaQuotesNewlineAndFormulaPrefix() {
        bath.setServiceName("=Tắm, \"spa\"\nchó"); services.save(bath); booking.create(customer, form(pet,bath));
        String csv = reports.csv("all",null,null);
        assertTrue(csv.contains("\"'=Tắm, \"\"spa\"\"\nchó\""));
    }

    @Test void legacyMigrationCapturesHistoryOnceWithoutRepricing() {
        Appointment old = new Appointment(Timestamp.from(Instant.now().plusSeconds(86400)), bath, groomer, customer, pet);
        old.setCreateTime(Timestamp.from(Instant.now())); old.setFinishTime(Timestamp.from(old.getStartTime().toInstant().plusSeconds(3600))); old.setStatus("Accepted"); old.setTotalprice(777.0);
        appointments.saveAndFlush(old); migration.run(null);
        bath.setServiceName("Tên mới"); bath.setBasicPrice(999999); services.save(bath); migration.run(null);
        Map<String,Object> result = booking.detail(customer, old.getAid());
        assertEquals(777.0,result.get("totalPrice")); assertEquals("confirmed",result.get("status"));
        @SuppressWarnings("unchecked") List<AppointmentItem> items = (List<AppointmentItem>)result.get("items");
        assertEquals("Tắm",items.get(0).getServiceName()); assertEquals(777L,items.get(0).getPrice());
    }
    @Test void rejectsFractionalPetAgeBeforePersistence() throws Exception {
        String body = "{\"name\":\"Lu\",\"species\":\"Chó\",\"size\":\"Vừa\",\"age\":1.9}";
        mvc.perform(post("/customer/api/pets").session(session(customer)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("400"));
        mvc.perform(put("/customer/api/pets/" + pet.getPid()).session(session(customer)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
        assertEquals(2, pets.count());
        assertEquals(3, pets.findById(pet.getPid()).orElseThrow().getAge());
    }
    @Test void rejectsFractionalServicePriceBeforePersistence() throws Exception {
        String body = "{\"serviceName\":\"Tắm\",\"basicPrice\":123.9,\"serviceTime\":60}";
        mvc.perform(post("/maintain/api/services").session(session(manager)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("400"));
        mvc.perform(put("/maintain/api/services/" + bath.getSid()).session(session(manager)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
        assertEquals(2, services.count());
        assertEquals(180000, services.findById(bath.getSid()).orElseThrow().getBasicPrice());
    }
    @Test void rejectsFractionalServiceDurationBeforePersistence() throws Exception {
        String body = "{\"serviceName\":\"Tắm\",\"basicPrice\":180000,\"serviceTime\":30.9}";
        mvc.perform(post("/maintain/api/services").session(session(manager)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("400"));
        mvc.perform(put("/maintain/api/services/" + bath.getSid()).session(session(manager)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
        assertEquals(2, services.count());
        assertEquals(60, services.findById(bath.getSid()).orElseThrow().getServiceTime());
    }
    @Test void rejectsEmptyGroomerGenderOnCreateAndEdit() throws Exception {
        for (String gender : Arrays.asList(null, "", " \t ")) {
            Groomer invalid = new Groomer(); invalid.setName("Nhân viên"); invalid.setGender(gender); invalid.setRank(1);
            String body = json.writeValueAsString(invalid);
            mvc.perform(post("/maintain/api/groomers").session(session(manager)).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("400"));
            mvc.perform(put("/maintain/api/groomers/" + groomer.getGid()).session(session(manager)).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        }
        assertEquals(1, groomers.count());
        assertEquals("Nữ", groomers.findById(groomer.getGid()).orElseThrow().getGender());
    }

    @Test void honeyDashboardCountsVisiblePetsIncludingLegacyNullFlags() throws Exception {
        Pet legacy = pet(customer, "Bé cũ"); legacy.setDeleted(null); pets.save(legacy);
        Pet deleted = pet(customer, "Đã xóa"); deleted.setDeleted(true); pets.save(deleted);
        mvc.perform(get("/maintain/api/dashboard").param("period", "all").session(session(manager)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.petCount").value(3));
    }
    @Test void honeyDailyChartExcludesCancelledRejectedAndExpired() throws Exception {
        int hour = 8;
        for (String status : List.of("pending", "cancelled", "rejected", "expired")) {
            BookingForm f = form(pet, bath); f.setStartTime(f.getStartTime().withHour(hour++));
            Map<String,Object> created = booking.create(customer, f);
            Appointment row = appointments.findByAid((Integer)created.get("aid")); row.setStatus(status); appointments.save(row);
        }
        mvc.perform(get("/maintain/api/reports").param("period", "all").session(session(manager)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalAppointments").value(4))
            .andExpect(jsonPath("$.data.daily[0].appointments").value(1));
    }
    @Test void honeyQuoteDetectsDiscountChangesEvenWhenNetTotalIsUnchanged() throws Exception {
        BookingForm f = form(pet, bath);
        Map<String,Object> body = new LinkedHashMap<>();
        body.put("petId", f.getPetId()); body.put("serviceIds", f.getServiceIds()); body.put("groomerId", f.getGroomerId());
        body.put("startTime", f.getStartTime()); body.put("expectedTotal", f.getExpectedTotal());
        body.put("expectedDuration", f.getExpectedDuration()); body.put("expectedDiscount", 0);
        bath.setBasicPrice(200000); bath.setDiscountPercent(10);
        bath.setPromotionStart(LocalDate.now(ApiViews.ZONE)); bath.setPromotionEnd(LocalDate.now(ApiViews.ZONE).plusDays(2)); services.save(bath);
        assertEquals(f.getExpectedTotal(), booking.quote(customer, f).get("totalPrice"));
        mvc.perform(post("/Appointment/api/appointments").session(session(customer)).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
            .andExpect(status().isConflict());
        assertEquals(0, appointments.count());
    }
    @Test void honeyAllowsPendingCancellationWithin24Hours() throws Exception {
        Map<String,Object> created = booking.create(customer, form(pet, bath));
        Appointment row = appointments.findByAid((Integer)created.get("aid"));
        row.setStartTime(Timestamp.from(Instant.now().plusSeconds(3600))); row.setFinishTime(Timestamp.from(Instant.now().plusSeconds(7200))); appointments.save(row);
        Appointment current = appointments.findByAid(row.getAid());
        mvc.perform(post("/Appointment/api/appointments/" + row.getAid() + "/cancel").param("version", String.valueOf(current.getVersion())).session(session(customer)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("cancelled"));
    }
    @Test void honeyConfirmationRequiresActiveStaffButKeepsExistingBookingVisible() throws Exception {
        Map<String,Object> created = booking.create(customer, form(pet, bath));
        catalog.accepting(groomer.getGid(), false);
        mvc.perform(post("/maintain/api/appointments/" + created.get("aid") + "/status").session(session(manager)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"confirmed\",\"version\":" + created.get("version") + "}"))
            .andExpect(status().isConflict());
        mvc.perform(get("/maintain/api/appointments/" + created.get("aid")).session(session(manager)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.groomerId").value(groomer.getGid()))
            .andExpect(jsonPath("$.data.status").value("pending"));
    }
    @Test void honeyAllowsOptionalPetBreed() throws Exception {
        mvc.perform(post("/customer/api/pets").session(session(customer)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Lu\",\"species\":\"Chó\",\"size\":\"Vừa\",\"age\":2}"))
            .andExpect(status().isOk());
    }
    @Test void staffFormAllowsBlankOptionalPhoneAndFormattedContact() throws Exception {
        for (String phone : List.of("", "+84 (90) 123-4567")) {
            Map<String,Object> body = new LinkedHashMap<>();
            body.put("name", "QA nhân viên"); body.put("gender", "Nữ"); body.put("rank", 1);
            body.put("phoneNumber", phone); body.put("title", ""); body.put("description", ""); body.put("imageURL", "");
            mvc.perform(post("/maintain/api/groomers").session(session(manager)).contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(body)))
                .andExpect(status().isOk());
        }
        mvc.perform(post("/maintain/api/groomers").session(session(manager)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"QA invalid\",\"gender\":\"Nữ\",\"rank\":1,\"phoneNumber\":\"abc1234\"}"))
            .andExpect(status().isBadRequest());
    }
    @Test void customerSearchSupportsDisplayNameEmailAndContactForFirebaseLinkedAccounts() throws Exception {
        customer.setName("Khách Ánh Dương"); customer.setEmail("anh.duong@pawpal.test"); customer.setPhoneNumber("0901234567");
        customer.setFirebaseUid("firebase-customer-uid"); users.save(customer);
        for (String query : List.of("anh duong", "anh.duong@pawpal.test", "0901234567")) {
            mvc.perform(get("/maintain/api/users").param("q", query).session(session(manager)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].uid").value(customer.getUid()));
        }
    }

    @Test void pendingExpiryIsPersistedAndNotifiedOnce() {
        Map<String,Object> a = booking.create(customer,form(pet,bath));
        Appointment row = appointments.findByAid((Integer)a.get("aid")); row.setStartTime(Timestamp.from(Instant.now().minusSeconds(3600))); row.setFinishTime(Timestamp.from(Instant.now())); appointments.save(row);
        expiry.expire(); expiry.expire();
        assertEquals("expired",appointments.findByAid(row.getAid()).getStatus());
        assertEquals(2,notifications.count());
    }

}
