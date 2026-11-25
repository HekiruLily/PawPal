package com.cpt202.appointment_system.Unit_Test;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import com.cpt202.appointment_system.Services.EmailServiceImpl;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {
    @Mock JavaMailSender emailSender;
    @InjectMocks EmailServiceImpl service;
    @Test void resetMailHasOnlyTheIntendedRecipientAndContent() {
        service.sendSimpleMessage("customer@example.com", "PawPal", "Mã xác nhận: 123456");
        ArgumentCaptor<SimpleMailMessage> capture = ArgumentCaptor.forClass(SimpleMailMessage.class); verify(emailSender).send(capture.capture());
        assertArrayEquals(new String[]{"customer@example.com"}, capture.getValue().getTo());
        assertEquals("Mã xác nhận: 123456", capture.getValue().getText());
    }
}
