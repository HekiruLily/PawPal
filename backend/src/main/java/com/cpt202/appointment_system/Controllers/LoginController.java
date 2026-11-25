package com.cpt202.appointment_system.Controllers;

import javax.servlet.http.*;
import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.http.ResponseEntity;
import com.cpt202.appointment_system.Common.*;
import com.cpt202.appointment_system.Models.User;
import com.cpt202.appointment_system.Services.*;

@Controller
@RequestMapping("/appointment-system")
public class LoginController {
    private final LoginService loginService;
    private final SessionService sessions;
    private final PasswordResetService resets;
    public LoginController(LoginService loginService, SessionService sessions, PasswordResetService resets) {
        this.loginService = loginService; this.sessions = sessions; this.resets = resets;
    }
    @PostMapping("/api/auth/login") @ResponseBody
    public Result<?> login(@RequestBody Map<String, String> body, HttpServletRequest request) {
        int code = loginService.loginUser(body.get("username"), body.get("password"));
        if (code == 3) throw new ApiException(429, "Sai mật khẩu 3 lần. Thử lại sau 15 phút.");
        if (code == 2) throw new ApiException(401, "Tài khoản hoặc mật khẩu không đúng.");
        User u = loginService.findAccount(body.get("username"));
        request.getSession(); request.changeSessionId();
        request.getSession().setAttribute("user", u.getUsername()); request.getSession().setAttribute("role", u.getType());
        return Result.success(ApiViews.user(u), "Đăng nhập thành công.");
    }
    @GetMapping("/api/auth/me") @ResponseBody
    public Result<?> me(HttpSession session) { return Result.success(ApiViews.user(sessions.user(session)), "OK"); }
    @PostMapping("/api/auth/logout") @ResponseBody
    public Result<?> logoutApi(HttpSession session) { session.invalidate(); return Result.success(); }
    @PostMapping("/api/auth/register") @ResponseBody
    public Result<?> register(@RequestBody User user) {
        int result = loginService.registerUser(user);
        if (result != 3) throw new ApiException(409, result == 1 ? "Tên đăng nhập đã tồn tại." : "Email đã tồn tại.");
        return Result.success(ApiViews.user(user), "Đăng ký thành công. Vui lòng đăng nhập.");
    }
    @PostMapping("/api/auth/reset-code") @ResponseBody
    public Result<?> resetCode(@RequestBody Map<String, String> body) { resets.send(body.get("username")); return Result.success(null, "Nếu tài khoản tồn tại, mã đã được gửi tới email."); }
    @PostMapping("/api/auth/reset-password") @ResponseBody
    public Result<?> reset(@RequestBody Map<String, String> body) { resets.change(body.get("username"), body.get("code"), body.get("password")); return Result.success(); }
    @PostMapping("/login")
    public String loginUser(@RequestParam String username, @RequestParam String password, Model model, HttpSession session, RedirectAttributes redirect) {
        int result = loginService.loginUser(username, password);
        if (result <= 1) {
            User u = loginService.findAccount(username); session.setAttribute("user", u.getUsername()); session.setAttribute("role", u.getType());
            redirect.addFlashAttribute("message", result == 1 ? "Administrator Login Success" : "Login Success");
        } else redirect.addFlashAttribute("error", "Login Failed");
        return "redirect:/appointment-system";
    }
    @PostMapping("/reg")
    public String registerUser(@RequestParam("rename") String username, @RequestParam("reemail") String email, @RequestParam("repass") String password,
            @RequestParam("repass2") String confirm, @RequestParam("phone") String phone, Model model, RedirectAttributes redirect, HttpSession session) {
        ApiException.require(password.equals(confirm), "Mật khẩu xác nhận không khớp.");
        User u = new User(username, password, 0); u.setEmail(email); u.setPhoneNumber(phone);
        int result = loginService.registerUser(u);
        if (result == 3) { session.setAttribute("user", u.getUsername()); session.setAttribute("role", 0); }
        else redirect.addFlashAttribute("error", "Tên đăng nhập hoặc email đã tồn tại.");
        return "redirect:/appointment-system";
    }
    @GetMapping("/logout") public String logout(HttpSession session) { session.invalidate(); return "redirect:/appointment-system"; }
    @GetMapping("/check-unique") @ResponseBody public ResponseEntity<String> checkUnique(@RequestParam String value) {
        return ResponseEntity.status(loginService.checkUnique(value) ? 200 : 409).body(loginService.checkUnique(value) ? "unique" : "duplicate");
    }
    @GetMapping("/check-uniqueem") @ResponseBody public ResponseEntity<String> checkUniqueem(@RequestParam String value) {
        return ResponseEntity.status(loginService.checkUniqueEmail(value) ? 200 : 409).body(loginService.checkUniqueEmail(value) ? "unique" : "duplicate");
    }
    @GetMapping("/reset-password-form") public String resetForm() { return "reset-password-form"; }
    @PostMapping("/sendForgotPasswordCode") public String sendForgotPasswordCode(@RequestParam String username) { resets.send(username); return "redirect:/appointment-system/reset-password-form"; }
    @PostMapping("/change-password") public String changePassword(@RequestParam String username, @RequestParam String verificationCode, @RequestParam String newPassword) {
        resets.change(username, verificationCode, newPassword); return "redirect:/appointment-system";
    }
}
