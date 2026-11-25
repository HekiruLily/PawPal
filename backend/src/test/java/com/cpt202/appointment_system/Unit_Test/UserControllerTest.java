package com.cpt202.appointment_system.Unit_Test;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import com.cpt202.appointment_system.Models.User;
import com.cpt202.appointment_system.Repositories.UserRepo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @Transactional
class UserControllerTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepo users;
    @Test void profileDoesNotExposePasswordAndForgedSessionRoleDoesNotGrantManagerAccess() throws Exception {
        User u = users.save(new User("profile_" + UUID.randomUUID().toString().substring(0,8), "password", 0));
        MockHttpSession session = new MockHttpSession(); session.setAttribute("user", u.getUsername()); session.setAttribute("role", 1);
        mvc.perform(get("/customer/api/profile").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.data.role").value("customer")).andExpect(jsonPath("$.data.password").doesNotExist());
        mvc.perform(get("/maintain/api/users").session(session)).andExpect(status().isForbidden());
    }
    @Test void anonymousProfileReturns401Json() throws Exception {
        mvc.perform(get("/customer/api/profile")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("401"));
    }
}
