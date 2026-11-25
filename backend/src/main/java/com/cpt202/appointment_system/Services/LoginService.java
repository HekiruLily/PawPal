package com.cpt202.appointment_system.Services;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import javax.servlet.http.HttpSession;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.cpt202.appointment_system.Models.User;
import com.cpt202.appointment_system.Repositories.UserRepo;
import static com.cpt202.appointment_system.Common.ApiException.require;

@Service
public class LoginService {
    private final UserRepo userRepository;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder();
    public LoginService(UserRepo users) { userRepository = users; }
    @Transactional
    public int loginUser(String identifier, String password) {
        if (identifier == null || password == null) return 2;
        User u = userRepository.lockByUsername(identifier.trim()).orElse(null);
        if (u == null) u = userRepository.lockByEmail(identifier.trim().toLowerCase()).orElse(null);
        if (u == null || u.getFirebaseUid() != null) return 2;
        if (u.getLockedUntil() != null && u.getLockedUntil().isAfter(Instant.now())) return 3;
        if (u.getLockedUntil() != null) { u.setLockedUntil(null); u.setFailedLoginAttempts(0); }
        String stored = u.getPassword();
        boolean matches = stored != null && (stored.startsWith("$2") ? passwords.matches(password, stored) : stored.equals(password));
        if (!matches) {
            int failed = u.getFailedLoginAttempts() == null ? 1 : u.getFailedLoginAttempts() + 1;
            u.setFailedLoginAttempts(failed);
            if (failed >= 3) u.setLockedUntil(Instant.now().plusSeconds(900));
            userRepository.save(u); return failed >= 3 ? 3 : 2;
        }
        if (!stored.startsWith("$2")) u.setPassword(passwords.encode(password));
        u.setFailedLoginAttempts(0); u.setLockedUntil(null); userRepository.save(u);
        return Integer.valueOf(1).equals(u.getType()) ? 1 : 0;
    }
    public User findAccount(String identifier) {
        User u = userRepository.findByUsername(identifier.trim());
        return u == null ? userRepository.findByEmail(identifier.trim().toLowerCase()).orElse(null) : u;
    }
    @Transactional
    public int registerUser(User user) {
        require(user.getUsername() != null && user.getUsername().matches("[A-Za-z0-9_.-]{3,50}"), "Tên đăng nhập từ 3 đến 50 ký tự chữ, số, _, ., -.");
        require(user.getEmail() != null && user.getEmail().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+") && user.getEmail().length() <= 100, "Email không hợp lệ.");
        if (userRepository.existsByUsername(user.getUsername())) return 1;
        user.setEmail(user.getEmail().trim().toLowerCase());
        if (userRepository.existsByEmail(user.getEmail())) return 2;
        user.setPassword(hash(user.getPassword())); user.setUid(null); user.setType(0); user.setFirebaseUid(null);
        user.setRegistrationTime(Timestamp.from(Instant.now())); user.setFailedLoginAttempts(0); user.setLockedUntil(null);
        userRepository.save(user); return 3;
    }
    public String hash(String password) {
        require(password != null && password.length() >= 8 && password.getBytes(StandardCharsets.UTF_8).length <= 72, "Mật khẩu tối thiểu 8 ký tự, tối đa 72 byte UTF-8.");
        return passwords.encode(password);
    }
    public ResponseEntity<String> logoutUser(HttpSession session) { session.invalidate(); return ResponseEntity.ok("Logged out"); }
    public boolean checkUnique(String name) { return !userRepository.existsByUsername(name); }
    public boolean checkUniqueEmail(String email) { return !userRepository.existsByEmail(email.toLowerCase()); }
}
