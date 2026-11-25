package com.cpt202.appointment_system.Unit_Test;

import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.cpt202.appointment_system.Common.ApiException;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;
import com.cpt202.appointment_system.Services.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {
    @Mock UserRepo users; @Mock PasswordResetRepo resets; @Mock LoginService login; @Mock EmailService mail;
    @InjectMocks PasswordResetService service;
    User user; PasswordReset reset;
    @BeforeEach void setup() {
        user = new User("customer", "old", 0); user.setUid(1); user.setEmail("customer@example.com");
        reset = new PasswordReset(); reset.setUserId(1); reset.setCodeHash(new BCryptPasswordEncoder().encode("123456")); reset.setExpiresAt(Instant.now().plusSeconds(600));
    }
    private void existing() { when(login.findAccount("customer")).thenReturn(user); when(resets.lockByUserId(1)).thenReturn(Optional.of(reset)); }
    @Test void wrongCodeConsumesAttemptWithoutUpdatingPassword() {
        existing(); assertThrows(ApiException.class, () -> service.change("customer", "000000", "newPassword"));
        assertEquals(1, reset.getAttempts()); verify(users, never()).save(any());
    }
    @Test void expiredAndExhaustedCodesCannotChangePassword() {
        existing(); reset.setExpiresAt(Instant.now().minusSeconds(1)); assertThrows(ApiException.class, () -> service.change("customer", "123456", "newPassword"));
        reset.setExpiresAt(Instant.now().plusSeconds(600)); reset.setAttempts(5); assertThrows(ApiException.class, () -> service.change("customer", "123456", "newPassword"));
        verify(users, never()).save(any());
    }
    @Test void successfulResetRemovesCodeAndUnlocksAccount() {
        existing(); when(login.hash("newPassword")).thenReturn("newHash");
        user.setFailedLoginAttempts(3); user.setLockedUntil(Instant.now().plusSeconds(900));
        service.change("customer", "123456", "newPassword");
        assertEquals("newHash", user.getPassword()); assertEquals(0, user.getFailedLoginAttempts()); assertNull(user.getLockedUntil()); verify(resets).delete(reset);
    }
    @Test void resendWithinOneMinuteDoesNotSendMail() {
        existing(); reset.setSentAt(Instant.now()); service.send("customer"); verifyNoInteractions(mail); verify(resets, never()).save(any());
    }
}
