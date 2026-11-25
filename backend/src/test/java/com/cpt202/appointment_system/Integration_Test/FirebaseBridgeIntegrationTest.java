package com.cpt202.appointment_system.Integration_Test;

import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.*;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.*;
import com.cpt202.appointment_system.Common.*;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;
import com.cpt202.appointment_system.Services.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real MVC/JPA/booking transactions; only the external Firebase gateway is mocked. */
@SpringBootTest
@AutoConfigureMockMvc
class FirebaseBridgeIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepo users;
    @Autowired PetRepo pets;
    @Autowired ServiceTypeRepo services;
    @Autowired AppointmentRepo appointments;
    @Autowired GroomerRepo groomers;
    @Autowired NotificationRepo notifications;
    @Autowired PasswordResetRepo resets;
    @Autowired LoginService login;
    @Autowired FirebaseBookingService guards;
    @MockBean FirebaseService firebase;
    int price;
    boolean active, manager;
    @BeforeEach void setup() throws Exception {
        notifications.deleteAll(); resets.deleteAll(); appointments.deleteAll(); pets.deleteAll(); services.deleteAll(); groomers.deleteAll(); users.deleteAll();
        price = 180000; active = true; manager = false;
        when(firebase.verify("valid")).thenReturn(new FirebaseService.Identity("alice", "alice@pawpal.test"));
        when(firebase.verify("invalid")).thenThrow(new ApiException(401, "Invalid token"));
        when(firebase.read(anyString())).thenAnswer(call -> {
            String path = call.getArgument(0);
            if (path.equals("roles/alice")) return json.valueToTree(manager ? "manager" : null);
            if (path.equals("users/alice")) return json.readTree("{\"name\":\"Alice\",\"phoneNumber\":\"0901234567\"}");
            if (path.equals("pets/alice/-pet")) return json.readTree("{\"ownerId\":\"alice\",\"name\":\"Bơ\",\"species\":\"Chó\",\"size\":\"Vừa\",\"age\":4}");
            if (path.equals("services/-service")) return json.valueToTree(Map.of("name", "Tắm", "category", "Tắm", "price", price, "duration", 60, "active", active));
            return json.nullNode();
        });
        Groomer g = new Groomer(); g.setName("QA Groomer"); g.setGender("Nữ"); g.setRank(1); g.setAcceptingAppointments(true); groomers.save(g);
    }
    private String body() throws Exception {
        return json.writeValueAsString(Map.of("firebasePetId", "-pet", "firebaseServiceIds", List.of("-service"),
                "expectedTotal", 180000, "expectedDuration", 60, "expectedDiscount", 0,
                "startTime", LocalDate.now(ApiViews.ZONE).plusDays(3).atTime(10, 0).atZone(ApiViews.ZONE).toOffsetDateTime().toString()));
    }
    private JsonNode send(String path) throws Exception {
        return json.readTree(mvc.perform(post(path).header("Authorization", "Bearer valid").contentType(MediaType.APPLICATION_JSON).content(body()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("data");
    }
    @Test void tokenCreatesUidLinkAndSqlBookingWithStableSnapshotsAndCancellation() throws Exception {
        JsonNode quote = send("/Appointment/api/quote"); assertEquals(180000, quote.path("totalPrice").asInt());
        JsonNode created = send("/Appointment/api/appointments");
        assertEquals("-pet", created.path("firebasePetId").asText());
        assertEquals("-service", created.path("items").get(0).path("firebaseServiceId").asText());
        assertEquals(1, users.count()); assertEquals(1, pets.count()); assertEquals(1, services.count());
        assertNotNull(appointments.findAll().get(0).getFirebaseLockKey());
        price = 230000; send("/Appointment/api/quote");
        mvc.perform(get("/Appointment/api/appointments").header("Authorization", "Bearer valid"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].totalPrice").value(180000));
        mvc.perform(post("/Appointment/api/appointments/" + created.path("aid").asInt() + "/cancel?version=" + created.path("version").asInt())
                .header("Authorization", "Bearer valid")).andExpect(status().isOk());
        assertEquals("cancelled", appointments.findAll().get(0).getStatus());
        verify(firebase).remove(appointments.findAll().get(0).getFirebaseLockKey());
        assertEquals(2, login.loginUser("alice@pawpal.test", "!FIREBASE_ONLY!"));
    }
    @Test void managerRoleIsReadFromTrustedFirebaseEveryRequestAndBadTokenCannotBorrowCookie() throws Exception {
        manager = true;
        mvc.perform(get("/maintain/api/groomers").header("Authorization", "Bearer valid")).andExpect(status().isOk());
        manager = false;
        mvc.perform(get("/maintain/api/groomers").header("Authorization", "Bearer valid")).andExpect(status().isForbidden());
        User admin = users.save(new User("sql-admin", "secret-password", 1));
        MockHttpSession cookie = new MockHttpSession(); cookie.setAttribute("user", admin.getUsername());
        mvc.perform(get("/maintain/api/groomers").session(cookie).header("Authorization", "Bearer invalid")).andExpect(status().isUnauthorized());
        mvc.perform(get("/maintain/api/groomers").session(cookie).header("Authorization", "Bearer valid")).andExpect(status().isForbidden());
    }
    @Test void rejectsUnownedPetNumericBypassStaleQuoteAndPausedServices() throws Exception {
        mvc.perform(post("/Appointment/api/quote").header("Authorization", "Bearer valid").contentType(MediaType.APPLICATION_JSON)
                .content("{\"petId\":1,\"serviceIds\":[1]}" )).andExpect(status().isBadRequest());
        mvc.perform(post("/Appointment/api/quote").header("Authorization", "Bearer valid").contentType(MediaType.APPLICATION_JSON)
                .content(body().replace("-pet", "foreign-pet"))).andExpect(status().isNotFound());
        send("/Appointment/api/quote"); price = 190000;
        mvc.perform(post("/Appointment/api/appointments").header("Authorization", "Bearer valid").contentType(MediaType.APPLICATION_JSON).content(body()))
                .andExpect(status().isConflict());
        verify(firebase).remove(startsWith("petBookings/alice/-pet/spring_")); assertEquals(0, appointments.count());
        active = false;
        mvc.perform(post("/Appointment/api/quote").header("Authorization", "Bearer valid").contentType(MediaType.APPLICATION_JSON).content(body()))
                .andExpect(status().isBadRequest());
    }
    @Test void missingAdminWriteFailsClosedAndNeverCreatesSqlBooking() throws Exception {
        doThrow(new ApiException(503, "Firebase unavailable")).when(firebase).write(anyString(), any());
        mvc.perform(post("/Appointment/api/appointments").header("Authorization", "Bearer valid").contentType(MediaType.APPLICATION_JSON).content(body()))
                .andExpect(status().isServiceUnavailable());
        assertEquals(0, appointments.count()); verify(firebase).remove(startsWith("petBookings/alice/-pet/spring_"));
    }
    @Test void emailCollisionCannotAutomaticallyTakeOverLegacyAccount() throws Exception {
        User legacy = new User("existing", "old-password", 1); legacy.setEmail("alice@pawpal.test"); users.save(legacy);
        mvc.perform(get("/appointment-system/api/auth/me").header("Authorization", "Bearer valid")).andExpect(status().isConflict());
        assertNull(users.findByUsername("existing").getFirebaseUid());
    }
    @Test void registrationCannotClaimFirebaseUidAndLinkedUsersCannotUseLegacyCookies() throws Exception {
        mvc.perform(post("/appointment-system/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"attacker\",\"password\":\"password123\",\"email\":\"attacker@pawpal.test\",\"firebaseUid\":\"alice\"}"))
                .andExpect(status().isOk());
        assertNull(users.findByUsername("attacker").getFirebaseUid());
        mvc.perform(get("/appointment-system/api/auth/me").header("Authorization", "Bearer valid")).andExpect(status().isOk());
        User linked = users.findByFirebaseUid("alice").orElseThrow();
        MockHttpSession cookie = new MockHttpSession(); cookie.setAttribute("user", linked.getUsername());
        mvc.perform(get("/appointment-system/api/auth/me").session(cookie)).andExpect(status().isUnauthorized());
    }
    @Test void reconciliationRemovesOnlyOldAbandonedGuardsAndRetainsOpenOrFreshReservations() throws Exception {
        send("/Appointment/api/appointments");
        String path = appointments.findAll().get(0).getFirebaseLockKey();
        String lock = path.substring(path.lastIndexOf('/') + 1);
        long old = Instant.now().minusSeconds(900).toEpochMilli();
        when(firebase.read("petBookings")).thenReturn(json.valueToTree(Map.of("alice", Map.of("-pet", Map.of(
                lock, Map.of("createdAt", old), "spring_orphan", Map.of("createdAt", old),
                "spring_new", Map.of("createdAt", Instant.now().toEpochMilli()), "external_index", true)))));
        org.springframework.test.util.ReflectionTestUtils.setField(guards, "enabled", true);
        try { guards.reconcile(); }
        finally { org.springframework.test.util.ReflectionTestUtils.setField(guards, "enabled", false); }
        verify(firebase).remove("petBookings/alice/-pet/spring_orphan");
        verify(firebase, never()).remove(path);
        verify(firebase, never()).remove("petBookings/alice/-pet/spring_new");
        verify(firebase, never()).remove("petBookings/alice/-pet/external_index");
    }
    @Test void scopedBackendNeverCleansReservationsFromAnotherDatabase() throws Exception {
        org.springframework.test.util.ReflectionTestUtils.setField(guards, "bookingScope", "machine-a");
        org.springframework.test.util.ReflectionTestUtils.setField(guards, "enabled", true);
        try {
            send("/Appointment/api/appointments");
            String live = appointments.findAll().get(0).getFirebaseLockKey();
            assertTrue(live.contains("/spring_machine-a_"));
            long old = Instant.now().minusSeconds(900).toEpochMilli();
            when(firebase.read("petBookings")).thenReturn(json.valueToTree(Map.of("alice", Map.of("-pet", Map.of(
                    "spring_machine-a_orphan", Map.of("createdAt", old),
                    "spring_machine-b_active", Map.of("createdAt", old),
                    "spring_legacy", Map.of("createdAt", old))))));
            guards.reconcile();
            verify(firebase).remove("petBookings/alice/-pet/spring_machine-a_orphan");
            verify(firebase, never()).remove("petBookings/alice/-pet/spring_machine-b_active");
            verify(firebase, never()).remove("petBookings/alice/-pet/spring_legacy");
            verify(firebase, never()).remove(live);
        } finally {
            org.springframework.test.util.ReflectionTestUtils.setField(guards, "bookingScope", "legacy");
            org.springframework.test.util.ReflectionTestUtils.setField(guards, "enabled", false);
        }
    }
    @Test void legacyBackendAlsoLeavesNewScopedReservationsUntouched() throws Exception {
        long old = Instant.now().minusSeconds(900).toEpochMilli();
        when(firebase.read("petBookings")).thenReturn(json.valueToTree(Map.of("alice", Map.of("-pet", Map.of(
                "spring_machine-b_active", Map.of("createdAt", old), "spring_abandoned", Map.of("createdAt", old))))));
        org.springframework.test.util.ReflectionTestUtils.setField(guards, "enabled", true);
        try { guards.reconcile(); }
        finally { org.springframework.test.util.ReflectionTestUtils.setField(guards, "enabled", false); }
        verify(firebase).remove("petBookings/alice/-pet/spring_abandoned");
        verify(firebase, never()).remove("petBookings/alice/-pet/spring_machine-b_active");
    }
}
