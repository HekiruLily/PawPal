package com.cpt202.appointment_system.Unit_Test;

import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
class AppointmentRepoTest {
    @Autowired UserRepo users; @Autowired PetRepo pets; @Autowired GroomerRepo groomers;
    @Autowired ServiceTypeRepo services; @Autowired AppointmentRepo appointments;
    Appointment a;
    @BeforeEach void setup() {
        User u = users.save(new User("repo_"+System.nanoTime(), "password", 0));
        Pet p = new Pet(); p.setUser(u); p.setName("Bơ"); p.setType("Dog"); p.setSize("Medium"); pets.save(p);
        Groomer g = new Groomer(); g.setName("Staff"); g.setGender("Nữ"); g.setRank(1); groomers.save(g);
        ServiceType s = services.save(new ServiceType("Repo bath", 60, 180000));
        a = new Appointment(Timestamp.from(Instant.now().plusSeconds(86400).truncatedTo(java.time.temporal.ChronoUnit.SECONDS)), s, g, u, p); a.setCreateTime(Timestamp.from(Instant.now()));
        a.setFinishTime(Timestamp.from(a.getStartTime().toInstant().plusSeconds(3600))); a.setStatus("pending"); a.setTotalprice(180000.0); appointments.saveAndFlush(a);
    }
    @Test void queriesUseCorrectEntityFields() {
        assertTrue(appointments.findByUserContaining(a.getUser().getUsername()).stream().anyMatch(row -> row.getAid().equals(a.getAid())));
        assertTrue(appointments.findByserviceType("Repo bath").stream().anyMatch(row -> row.getAid().equals(a.getAid())));
        assertTrue(appointments.findBytotalPrice(180000.0).stream().anyMatch(row -> row.getAid().equals(a.getAid())));
    }
    @Test void lockingOverlapQueryHasExclusiveEndBoundary() {
        assertTrue(appointments.lockOverlapping(a.getStartTime(), a.getFinishTime()).stream().anyMatch(row -> row.getAid().equals(a.getAid())));
        assertTrue(appointments.lockOverlapping(a.getFinishTime(), Timestamp.from(a.getFinishTime().toInstant().plusSeconds(3600))).stream().noneMatch(row -> row.getAid().equals(a.getAid())));
    }
}
