package com.cpt202.appointment_system.Services;

import java.security.SecureRandom;
import java.time.Instant;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cpt202.appointment_system.Common.ApiException;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.*;

@Service
public class PasswordResetService {
    private final UserRepo users;
    private final PasswordResetRepo resets;
    private final LoginService login;
    private final EmailService email;
    private final BCryptPasswordEncoder hashes = new BCryptPasswordEncoder();
    public PasswordResetService(UserRepo users, PasswordResetRepo resets, LoginService login, EmailService email) {
        this.users = users; this.resets = resets; this.login = login; this.email = email;
    }
    @Transactional
    public void send(String identifier) {
        if (identifier == null) throw new ApiException(400, "Nhập tài khoản hoặc email.");
        User u = login.findAccount(identifier);
        if (u == null || u.getEmail() == null || u.getFirebaseUid() != null) return;
        // Lock the account too: two first requests cannot both create a reset row.
        users.lockByUid(u.getUid());
        PasswordReset reset = resets.lockByUserId(u.getUid()).orElseGet(PasswordReset::new);
        if (reset.getSentAt() != null && reset.getSentAt().plusSeconds(60).isAfter(Instant.now())) return;
        String code = String.valueOf(100000 + new SecureRandom().nextInt(900000));
        reset.setUserId(u.getUid()); reset.setCodeHash(hashes.encode(code)); reset.setSentAt(Instant.now());
        reset.setExpiresAt(Instant.now().plusSeconds(600)); reset.setAttempts(0); resets.save(reset);
        email.sendSimpleMessage(u.getEmail(), "PawPal — Đặt lại mật khẩu", "Mã xác nhận: " + code + ". Có hiệu lực 10 phút, chỉ dùng một lần.");
    }
    @Transactional(noRollbackFor = ApiException.class)
    public void change(String identifier, String code, String password) {
        if (identifier == null) throw new ApiException(400, "Nhập tài khoản hoặc email.");
        User u = login.findAccount(identifier);
        if (u == null || u.getFirebaseUid() != null) throw new ApiException(400, "Mã xác nhận không hợp lệ.");
        users.lockByUid(u.getUid());
        PasswordReset reset = resets.lockByUserId(u.getUid()).orElseThrow(() -> new ApiException(400, "Mã xác nhận không hợp lệ."));
        if (reset.getExpiresAt().isBefore(Instant.now()) || reset.getAttempts() >= 5) throw new ApiException(400, "Mã đã hết hạn hoặc vượt số lần thử.");
        if (code == null || !hashes.matches(code, reset.getCodeHash())) {
            reset.setAttempts(reset.getAttempts() + 1); throw new ApiException(400, "Mã xác nhận không hợp lệ.");
        }
        u.setPassword(login.hash(password)); u.setFailedLoginAttempts(0); u.setLockedUntil(null); users.save(u); resets.delete(reset);
    }
}
