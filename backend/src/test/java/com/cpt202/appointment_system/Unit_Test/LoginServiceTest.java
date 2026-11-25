package com.cpt202.appointment_system.Unit_Test;

import java.util.Optional;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.cpt202.appointment_system.Models.User;
import com.cpt202.appointment_system.Repositories.UserRepo;
import com.cpt202.appointment_system.Services.LoginService;
import com.cpt202.appointment_system.Common.ApiException;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {
    @Mock UserRepo users;
    @InjectMocks LoginService login;
    private User customer() { User u = new User("customer", "password", 0); u.setEmail("customer@example.com"); return u; }
    @Test void successfulLegacyLoginUpgradesPasswordHash() {
        User u = customer(); when(users.lockByUsername("customer")).thenReturn(Optional.of(u));
        assertEquals(0, login.loginUser("customer", "password"));
        assertTrue(new BCryptPasswordEncoder().matches("password", u.getPassword()));
    }
    @Test void wrongPasswordsLockAfterThreeAttempts() {
        User u = customer(); when(users.lockByUsername("customer")).thenReturn(Optional.of(u));
        assertEquals(2, login.loginUser("customer", "wrong")); assertEquals(2, login.loginUser("customer", "wrong"));
        assertEquals(3, login.loginUser("customer", "wrong")); assertEquals(3, login.loginUser("customer", "password"));
        assertNotNull(u.getLockedUntil());
    }
    @Test void registrationCannotCreateManagerOrKeepPlainPassword() {
        User u = customer(); u.setType(1); assertEquals(3, login.registerUser(u)); assertEquals(0, u.getType());
        assertTrue(new BCryptPasswordEncoder().matches("password", u.getPassword())); verify(users).save(u);
    }
    @Test void duplicateUsernameAndEmailAreRejected() {
        User u = customer(); when(users.existsByUsername("customer")).thenReturn(true); assertEquals(1, login.registerUser(u));
        when(users.existsByUsername("customer")).thenReturn(false); when(users.existsByEmail(u.getEmail())).thenReturn(true); assertEquals(2, login.registerUser(u)); verify(users, never()).save(any());
    }
    @Test void shortPasswordCannotBeRegistered() { User u = customer(); u.setPassword("short"); assertThrows(ApiException.class, () -> login.registerUser(u)); verify(users, never()).save(any()); }
    @Test void emailLoginReturnsServerRole() {
        User u = customer(); u.setType(1); when(users.lockByEmail(u.getEmail())).thenReturn(Optional.of(u)); assertEquals(1, login.loginUser(u.getEmail(), "password"));
    }
}
