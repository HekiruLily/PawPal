package com.cpt202.appointment_system.Controllers;

import java.security.Provider.Service;
import java.util.ArrayList;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.cpt202.appointment_system.Common.Result;
import com.cpt202.appointment_system.Models.Appointment;
import com.cpt202.appointment_system.Models.Groomer;
import com.cpt202.appointment_system.Models.ServiceType;
import com.cpt202.appointment_system.Models.User;
import com.cpt202.appointment_system.Repositories.AppointmentRepo;
import com.cpt202.appointment_system.Repositories.GroomerRepo;
import com.cpt202.appointment_system.Services.GroomerService;
import com.cpt202.appointment_system.Services.UserService;
import com.cpt202.appointment_system.Services.ServiceTypeService;
import com.cpt202.appointment_system.Services.AppointmentService;

// @RestController
@Controller
// @RequestMapping("manager")
@RequestMapping("/maintain")
public class ManagerController {
    @Autowired private com.cpt202.appointment_system.Services.SessionService sessions;
    @Autowired private com.cpt202.appointment_system.Services.CatalogService catalog;
    @Autowired private com.cpt202.appointment_system.Services.BookingService booking;
    @Autowired private com.cpt202.appointment_system.Services.ReportService reports;

    @GetMapping("/api/services") @ResponseBody
    public Result<?> services(@RequestParam(required=false) String q, javax.servlet.http.HttpSession session) {
        sessions.manager(session); return Result.success(catalog.services(true, q), "OK");
    }
    @PostMapping("/api/services") @ResponseBody
    public Result<?> createService(@RequestBody ServiceType input, javax.servlet.http.HttpSession session) {
        sessions.manager(session); return Result.success(catalog.saveService(null, input), "OK");
    }
    @PutMapping("/api/services/{sid}") @ResponseBody
    public Result<?> editService(@org.springframework.web.bind.annotation.PathVariable Integer sid, @RequestBody ServiceType input, javax.servlet.http.HttpSession session) {
        sessions.manager(session); return Result.success(catalog.saveService(sid, input), "OK");
    }
    @PostMapping("/api/services/{sid}/active") @ResponseBody
    public Result<?> activeService(@org.springframework.web.bind.annotation.PathVariable Integer sid, @RequestParam boolean active, javax.servlet.http.HttpSession session) {
        sessions.manager(session); return Result.success(catalog.serviceActive(sid, active), "OK");
    }
    @PostMapping("/api/groomers") @ResponseBody
    public Result<?> createGroomer(@RequestBody Groomer input, javax.servlet.http.HttpSession session) {
        sessions.manager(session); return Result.success(catalog.saveGroomer(null, input), "OK");
    }
    @PutMapping("/api/groomers/{gid}") @ResponseBody
    public Result<?> editGroomer(@org.springframework.web.bind.annotation.PathVariable Integer gid, @RequestBody Groomer input, javax.servlet.http.HttpSession session) {
        sessions.manager(session); return Result.success(catalog.saveGroomer(gid, input), "OK");
    }
    @org.springframework.web.bind.annotation.DeleteMapping("/api/groomers/{gid}") @ResponseBody
    public Result<?> removeGroomer(@org.springframework.web.bind.annotation.PathVariable Integer gid, javax.servlet.http.HttpSession session) {
        sessions.manager(session); catalog.deleteGroomer(gid); return Result.success();
    }
    @GetMapping("/api/appointments") @ResponseBody
    public Result<?> appointments(@RequestParam(required=false) String status, @RequestParam(required=false) String q, javax.servlet.http.HttpSession session) {
        return Result.success(booking.list(sessions.manager(session), true, status, q), "OK");
    }
    @GetMapping("/api/appointments/{aid}") @ResponseBody
    public Result<?> appointment(@org.springframework.web.bind.annotation.PathVariable Integer aid, javax.servlet.http.HttpSession session) {
        return Result.success(booking.detail(sessions.manager(session), aid), "OK");
    }
    @PostMapping("/api/appointments/{aid}/status") @ResponseBody
    public Result<?> status(@org.springframework.web.bind.annotation.PathVariable Integer aid, @RequestBody Map<String, Object> body, javax.servlet.http.HttpSession session) {
        return Result.success(booking.transition(sessions.manager(session), aid, body.get("status") instanceof String ? (String)body.get("status") : "invalid", number(body.get("groomerId")), version(body.get("version"))), "OK");
    }
    @PostMapping("/api/appointments/{aid}/assign") @ResponseBody
    public Result<?> assign(@org.springframework.web.bind.annotation.PathVariable Integer aid, @RequestBody Map<String, Object> body, javax.servlet.http.HttpSession session) {
        Integer gid = number(body.get("groomerId")); com.cpt202.appointment_system.Common.ApiException.require(gid != null, "Chọn nhân viên.");
        return Result.success(booking.transition(sessions.manager(session), aid, null, gid, version(body.get("version"))), "OK");
    }
    private Integer number(Object value) {
        if (value == null) return null;
        com.cpt202.appointment_system.Common.ApiException.require(value instanceof Number && ((Number)value).doubleValue() == ((Number)value).intValue(), "ID phải là số nguyên hợp lệ.");
        return ((Number)value).intValue();
    }
    private Long version(Object value) {
        if (value == null) return null;
        com.cpt202.appointment_system.Common.ApiException.require(value instanceof Number && ((Number)value).doubleValue() == ((Number)value).longValue(), "version phải là số nguyên.");
        return ((Number)value).longValue();
    }
    @GetMapping("/api/reports") @ResponseBody
    public Result<?> report(@RequestParam(defaultValue="7") String period,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to,
            javax.servlet.http.HttpSession session) {
        sessions.manager(session); return Result.success(reports.report(period, from, to), "OK");
    }
    @GetMapping(value="/api/reports.csv", produces="text/csv;charset=UTF-8") @ResponseBody
    public org.springframework.http.ResponseEntity<String> csv(@RequestParam(defaultValue="7") String period,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required=false) @org.springframework.format.annotation.DateTimeFormat(iso=org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to,
            javax.servlet.http.HttpSession session) {
        sessions.manager(session); return org.springframework.http.ResponseEntity.ok().header("Content-Disposition", "attachment; filename=pawpal-report.csv").body(reports.csv(period, from, to));
    }
    @GetMapping("/api/dashboard") @ResponseBody
    public Result<?> dashboard(@RequestParam(defaultValue="7") String period, javax.servlet.http.HttpSession session) {
        sessions.manager(session); Map<String,Object> result = reports.report(period, null, null);
        result.put("customerCount", userService.listAllCustomers_M().size());
        result.put("petCount", catalog.petCount());
        result.put("pendingAppointments", booking.list(sessions.manager(session), true, "pending", null).size());
        return Result.success(result, "OK");
    }
    @GetMapping("/api/users") @ResponseBody
    public Result<?> users(@RequestParam(required=false) String q, javax.servlet.http.HttpSession session) {
        sessions.manager(session);
        java.util.List<User> all = q == null || q.isBlank() ? userService.listAllCustomers_M() : userService.searchCustomerByName_M(q);
        return Result.success(all.stream().filter(u -> Integer.valueOf(0).equals(u.getType())).map(com.cpt202.appointment_system.Common.ApiViews::user).collect(java.util.stream.Collectors.toList()), "OK");
    }


    @Autowired
    private UserService userService;

    @Autowired
    private GroomerService groomerService;

    @Autowired
    private ServiceTypeService ServiceTypeService;

    @Autowired
    private AppointmentService AppointmentService;

    @Autowired
    private GroomerRepo GroomerRepo;

    @Autowired
    private AppointmentRepo AppointmentRepo;

    // @GetMapping("")
    // public String showMaintainPage(Model model) {
    // List<User> users = userService.listAllCustomers_M();
    // model.addAttribute("users", users);
    // List<Groomer> groomers = groomerService.listAllGroomers();
    // model.addAttribute("groomers", groomers);
    // List<ServiceType> services = ServiceTypeService.getAllServiceTypes();
    // model.addAttribute("serviceTypes", services);
    // List<Appointment> appointments = AppointmentService.getAllAppointments();
    // model.addAttribute("appointments", appointments);
    // // List<User> userList = userService.listAllCustomers_M();
    // // model.addAttribute("userList", userList);
    // // model.addAttribute("userSearchRst", new ArrayList<User>());
    // return "manager";
    // }
    @GetMapping("/maintainUser")
    public String showMaintainUserPage(Model model) {
        List<User> users = userService.listAllCustomers_M();
        model.addAttribute("users", users);
        return "MaintainUser";
    }

    // @GetMapping("/searchUser")
    // public String searchUser(Model model) {
    // model.addAttribute("keyword", new String());
    // return "MaintainUser";
    // }

    @PostMapping("/searchUser")
    public String searchUserByKey(Model model, @RequestParam("keyword") String keyword) {
        List<User> userSearchRst = userService.searchCustomerByName_M(keyword);
        model.addAttribute("users", userSearchRst);
        return "MaintainUser";
    }

    @GetMapping("/maintainGroomer")
    public String showMaintainGroomerPage(Model model) {
        List<Groomer> groomers = groomerService.listAllGroomers();
        model.addAttribute("groomers", groomers);
        return "MaintainGroomer";
    }

    @PostMapping("/deleteGroomer")
    public String deleteGroomer(@ModelAttribute Groomer groomer) {
        Integer gid = groomer.getGid();
        groomerService.deleteGroomerById(gid);
        return "redirect:/maintain/maintainGroomer";
    }

    // @PostMapping("/addGroomer")
    // public String addGroomer(@ModelAttribute Groomer groomer) {
    // groomerService.updateGroomer(groomer);
    // return "redirect:/maintain/maintainGroomer";
    // }

    @PostMapping("/updateGroomer")
    public String updateGroomer(@ModelAttribute Groomer groomer) {
        groomerService.updateGroomer(groomer);
        return "redirect:/maintain/maintainGroomer";
    }

    @PostMapping("/searchGroomer")
    public String searchGroomer(Model model, @RequestParam("keyword") String keyword) {
        List<Groomer> groomers = groomerService.searchGroomerByName_M(keyword);
        model.addAttribute("groomers", groomers);
        return "MaintainGroomer";
    }

    @GetMapping("/api/groomers")
    @ResponseBody
    public List<Map<String, Object>> listGroomersForMobile() {
        return catalog.groomers(true, null);
    }

    @PostMapping("/api/groomers/{gid}/accepting")
    @ResponseBody
    public Map<String, Object> setGroomerAcceptingStatus(
            @org.springframework.web.bind.annotation.PathVariable Integer gid,
            @RequestParam("accepting") boolean accepting) {
        Groomer groomer = catalog.accepting(gid, accepting);
        return java.util.Map.of("gid", gid, "acceptingAppointments", groomer.getAcceptingAppointments());
    }

    private String extractAddress(String description) {
        if (description == null) return "";
        for (String line : description.split("\\r?\\n")) {
            if (line.trim().startsWith("Địa chỉ:")) {
                return line.trim().replaceFirst("^Địa chỉ:\\s*", "").trim();
            }
        }
        return "";
    }

    @GetMapping("maintainServiceType")
    public String showMaintainServiceTypePage(Model model) {
        List<ServiceType> serviceTypes = ServiceTypeService.getAllServiceTypes();
        model.addAttribute("serviceTypes", serviceTypes);
        return "MaintainServiceType";
    }

    @PostMapping("/deleteServiceType")
    public String deleteServiceType(@ModelAttribute ServiceType serviceType) {
        Integer sid = serviceType.getSid();
        ServiceTypeService.deleteServiceTypeById(sid);
        return "redirect:/maintain/maintainServiceType";
    }

    @PostMapping("/updateServiceType")
    public String updateServiceType(@ModelAttribute ServiceType serviceType) {
        ServiceTypeService.updateServiceType(serviceType);
        return "redirect:/maintain/maintainServiceType";
    }

    @PostMapping("/searchServiceType")
    public String searchServiceType(Model model, @RequestParam("keyword") String keyword) {
        List<ServiceType> serviceTypes = ServiceTypeService.searchServiceTypeByName_M(keyword);
        model.addAttribute("serviceTypes", serviceTypes);
        return "MaintainServiceType";
    }

    @GetMapping("maintainAppointment")
    public String showMaintainAppointmentPage(Model model) {
        List<Appointment> appointments = AppointmentService.getAllAppointments();
        model.addAttribute("appointments", appointments);
        return "MaintainAppointment";
    }

    @PostMapping("/updateAppointment")
    public String updateAppointment(@ModelAttribute Appointment appointment) {
        // AppointmentRepo.updateStatusByAid(appointment.getStatus(),
        // appointment.getAid());
        System.out.println(appointment.getStatus());
        AppointmentService.updateAppointment(appointment);

        return "redirect:/maintain/maintainAppointment";
    }

    @PostMapping("/searchAppointment")
    public String searchAppointment(Model model, @RequestParam("keyword") String keyword) {
        List<Appointment> Appointments = AppointmentService.appointmentSearch_M(keyword);
        model.addAttribute("appointments", Appointments);
        return "MaintainAppointment";
    }

    // @PostMapping("/addServiceType")
    // public String addServiceType(@ModelAttribute ServiceType service) {
    // ServiceTypeService.updateServiceType(service);
    // return "redirect:/maintain/maintainServiceType";
    // }

    // @GetMapping("/delete")
    // public Result<?> deleteUser1(@RequestParam("uid") Integer uid) {
    // userService.deleteUserById(uid);
    // // return "redirect:/appointment-system/manager";
    // return Result.success();
    // }

    // Manager can delete customer by id
    // @PostMapping("/delete")
    // public Result<?> deleteUser(@RequestParam("uid") Integer uid) {
    // userService.deleteUserById(uid);
    // // return "redirect:/appointment-system/manager";
    // return Result.success();
    // }

    // @GetMapping("/delete")
    // public String deleteTU(Model model) {
    // model.addAttribute("user", new User());
    // return "manager";
    // }

    // // for testing
    // @PostMapping("/deleteUser")
    // public String deleteUser(@ModelAttribute User user) {
    // Integer uid = user.getUid();
    // userService.deleteUserById(uid);
    // return "redirect:/manager";
    // // return Result.success();
    // }

    // @PostMapping("/searchUser")
    // public String searchUserByKey(@ModelAttribute("searchedUser") User
    // searchedUser, Model model) {
    // String searchedName = searchedUser.getUsername();
    // List<User> userSearchRst = userService.searchCustomerByName_M(searchedName);
    // model.addAttribute("userSearchRst", userSearchRst);
    // return "redirect:/manager";
    // // return Result.success();
    // }

    // @GetMapping("/manager/appointmentList/search")
    // public String appointmentSearch(Model model) {
    // model.addAttribute("keyword", new String());
    // return "allAppointments";
    // }

    // @PostMapping("/manager/appointmentList/search")
    // public String appointmentSearchBykey(Model model, @RequestParam("keyword")
    // String keyword) {
    // model.addAttribute("appointmentList",
    // appointmentService.appointmentSearch(keyword));
    // return "allAppointments";
    // }
    // @PostMapping("/user")
    // public String updateUser(@ModelAttribute("user") User user,
    // RedirectAttributes redirectAttributes) {
    // userService.updateUser(user);
    // redirectAttributes.addFlashAttribute("successMessage", "User updated
    // successfully");
    // return "redirect:/manager/maintain";
    // }

    // @PostMapping("/manager")
    // public String updateGroomer(@ModelAttribute("groomer") Groomer
    // groomer,RedirectAttributes redirectAttributes) {
    // // Groomer groomer1 = GroomerRepo.findByGid(gid);
    // groomerService.editGroomer_M(groomer);

    // redirectAttributes.addFlashAttribute("successMessage", "Groomer updated
    // successfully");
    // return "redirect:/manager";
    // }

    // @PostMapping("/serviceType")
    // public String updateServiceType(@ModelAttribute("services") ServiceType
    // service, RedirectAttributes redirectAttributes) {
    // ServiceTypeService.editServiceType(service);
    // redirectAttributes.addFlashAttribute("successMessage", "Service updated
    // successfully");
    // return "redirect:/manager";
    // }

    @GetMapping("/report")
    public String showReport(Model model,
            @RequestParam(value = "year", required = false, defaultValue = "2023") int year) {
        model.addAttribute("appointments", AppointmentService.findAllSale());
        model.addAttribute("annualAppointments", AppointmentService.getAnnualStaticalReport());
        model.addAttribute("quarterlyAppointments", AppointmentService.getQuarterlyStaticalReport(year));

        return "report";
    }

}
