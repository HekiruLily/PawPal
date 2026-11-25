package com.cpt202.appointment_system.Services;

import javax.servlet.http.HttpSession;
import org.springframework.stereotype.Service;
import com.cpt202.appointment_system.Common.ApiException;
import com.cpt202.appointment_system.Models.User;
import com.cpt202.appointment_system.Repositories.UserRepo;

@Service
public class SessionService {
    private final UserRepo users;
    public SessionService(UserRepo users) { this.users = users; }
    public User user(HttpSession session) {
        org.springframework.web.context.request.RequestAttributes attrs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (attrs instanceof org.springframework.web.context.request.ServletRequestAttributes) {
            Object trusted = ((org.springframework.web.context.request.ServletRequestAttributes) attrs).getRequest().getAttribute(FirebaseBridgeService.REQUEST_USER);
            if (trusted instanceof User) return (User) trusted;
        }
        Object name = session == null ? null : session.getAttribute("user");
        User user = name instanceof String ? users.findByUsername((String) name) : null;
        if (user == null || user.getFirebaseUid() != null) throw new ApiException(401, "Vui lòng đăng nhập lại.");
        return user;
    }
    public User current() {
        org.springframework.web.context.request.RequestAttributes attrs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (!(attrs instanceof org.springframework.web.context.request.ServletRequestAttributes)) throw new ApiException(401, "Vui lòng đăng nhập.");
        return user(((org.springframework.web.context.request.ServletRequestAttributes) attrs).getRequest().getSession(false));
    }
    public User customer(HttpSession session) {
        User user = user(session);
        if (!Integer.valueOf(0).equals(user.getType())) throw new ApiException(403, "Chức năng dành cho khách hàng.");
        return user;
    }
    public User manager(HttpSession session) {
        User user = user(session);
        if (!Integer.valueOf(1).equals(user.getType())) throw new ApiException(403, "Cần quyền quản lý.");
        return user;
    }
}
