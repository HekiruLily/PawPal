package com.cpt202.appointment_system.Integration_Test;

import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.*;
import com.cpt202.appointment_system.Common.ApiViews;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest @AutoConfigureMockMvc
class LoginThenMakeAppointmentTest {
    @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired UserRepo users; @Autowired PetRepo pets;
    @Autowired GroomerRepo groomers; @Autowired ServiceTypeRepo services; @Autowired AppointmentRepo appointments;
    @Test void loginQuoteAndBookOnceThroughHttp() throws Exception {
        User u = users.save(new User("flow_"+System.nanoTime(), "password", 0));
        Pet p = new Pet(); p.setUser(u); p.setName("Flow pet"); p.setType("Dog"); p.setSize("Small"); pets.save(p);
        Groomer g = new Groomer(); g.setName("Flow staff"); g.setGender("Nam"); g.setRank(1); groomers.save(g);
        ServiceType s = services.save(new ServiceType("Flow bath", 30, 90000));
        MockHttpSession session = new MockHttpSession();
        mvc.perform(post("/appointment-system/api/auth/login").session(session).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("username", u.getUsername(), "password", "password")))).andExpect(status().isOk());
        Map<String,Object> body = new HashMap<>(); body.put("petId", p.getPid()); body.put("serviceIds", List.of(s.getSid())); body.put("groomerId", g.getGid());
        body.put("startTime", LocalDate.now(ApiViews.ZONE).plusDays(3).atTime(9,0).atZone(ApiViews.ZONE).toOffsetDateTime().toString());
        String quote = mvc.perform(post("/Appointment/api/quote").session(session).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode q = json.readTree(quote).get("data"); body.put("expectedTotal", q.get("totalPrice").asLong()); body.put("expectedDuration", q.get("durationMinutes").asInt());
        long before = appointments.count();
        mvc.perform(post("/Appointment/api/appointments").session(session).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("pending"));
        assertEquals(before+1, appointments.count());
    }
}
