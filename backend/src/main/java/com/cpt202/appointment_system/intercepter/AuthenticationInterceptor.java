package com.cpt202.appointment_system.intercepter;

import javax.servlet.http.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import com.cpt202.appointment_system.Common.ApiException;
import com.cpt202.appointment_system.Services.SessionService;

@Component
public class AuthenticationInterceptor implements HandlerInterceptor {
    private final SessionService sessions;
    @org.springframework.beans.factory.annotation.Autowired
    private com.cpt202.appointment_system.Services.FirebaseBridgeService firebase;
    private final Set<String> allowed;
    public AuthenticationInterceptor(SessionService sessions, @Value("${pawpal.allowed-origins:http://localhost:8081}") String origins) {
        this.sessions = sessions; allowed = new HashSet<>(Arrays.asList(origins.split(",")));
    }
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        if ("OPTIONS".equals(request.getMethod())) return true;
        if (!Set.of("GET", "HEAD").contains(request.getMethod())) {
            String origin = request.getHeader("Origin");
            String same = request.getScheme() + "://" + request.getServerName() + ((request.getServerPort() == 80 || request.getServerPort() == 443) ? "" : ":" + request.getServerPort());
            if ((origin != null && !origin.equals(same) && !allowed.contains(origin)) || "cross-site".equals(request.getHeader("Sec-Fetch-Site")))
                throw new ApiException(403, "Nguồn yêu cầu không được phép.");
        }
        boolean publicPath = path.equals("/error") || path.startsWith("/assets/") || path.startsWith("/uploads/")
            || path.equals("/appointment-system") || path.equals("/appointment-system/")
            || Set.of("/appointment-system/login", "/appointment-system/reg", "/appointment-system/logout", "/appointment-system/check-unique", "/appointment-system/check-uniqueem",
                "/appointment-system/reset-password-form", "/appointment-system/sendForgotPasswordCode", "/appointment-system/change-password",
                "/appointment-system/api/auth/login", "/appointment-system/api/auth/register", "/appointment-system/api/auth/reset-code", "/appointment-system/api/auth/reset-password", "/appointment-system/api/auth/logout").contains(path);
        if (publicPath) return true;
        String authorization = request.getHeader("Authorization");
        if (authorization != null) {
            if (!authorization.startsWith("Bearer ")) throw new ApiException(401, "Token không hợp lệ.");
            com.cpt202.appointment_system.Models.User trusted;
            try { trusted = firebase.authenticate(authorization.substring(7)); }
            catch (org.springframework.dao.DataIntegrityViolationException race) {
                // Parallel first requests may both attempt the same unique UID link.
                trusted = firebase.authenticate(authorization.substring(7));
            }
            request.setAttribute(com.cpt202.appointment_system.Services.FirebaseBridgeService.REQUEST_USER, trusted);
        }
        try {
            if (path.startsWith("/maintain") || path.startsWith("/manager") || path.startsWith("/appointment-system/manager") || path.startsWith("/customer/manager") || path.startsWith("/Appointment/manager") || path.equals("/appointment-system/addService")) sessions.manager(request.getSession(false));
            else if ((path.startsWith("/customer") && !path.equals("/customer/api/uploads")) || path.startsWith("/Appointment")) sessions.customer(request.getSession(false));
            else sessions.user(request.getSession(false));
        } catch (ApiException e) {
            if (path.contains("/api/") || path.endsWith(".csv")) throw e;
            if (e.getStatus() == 401) { response.sendRedirect("/appointment-system"); return false; }
            throw e;
        }
        return true;
    }
}
