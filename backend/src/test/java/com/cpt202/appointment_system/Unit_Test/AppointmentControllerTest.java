package com.cpt202.appointment_system.Unit_Test;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.servlet.mvc.support.RedirectAttributesModelMap;
import com.cpt202.appointment_system.Common.Result;
import com.cpt202.appointment_system.Controllers.AppointmentController;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Services.AppointmentService;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AppointmentControllerTest {
    @Mock AppointmentService service;
    @InjectMocks AppointmentController controller;
    @Test void webSubmitCreatesExactlyOnceAndPaymentUsesServerTotal() {
        AppointmentForm form = new AppointmentForm(); form.setStartTime("2026-12-01T10:00:00");
        form.setPet(new Pet(1)); form.setServiceType(new ServiceType(1)); form.setGroomer(new Groomer(1));
        doReturn(Result.success(Map.of("totalPrice", 153000.0), "OK")).when(service).makeAppointment_C(any());
        MockHttpSession session = new MockHttpSession();
        assertEquals("redirect:/Appointment/payment", controller.makeappointment_C(form, session, new RedirectAttributesModelMap()));
        assertEquals(153000.0, session.getAttribute("price")); verify(service, times(1)).makeAppointment_C(any());
    }
}
