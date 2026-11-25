package com.cpt202.appointment_system.Services;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cpt202.appointment_system.Common.*;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.AppointmentRepo;

@Service
@Transactional(readOnly = true)
public class ReportService {
    private final AppointmentRepo appointments;
    public ReportService(AppointmentRepo appointments) { this.appointments = appointments; }
    public List<Appointment> rows(String period, LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(ApiViews.ZONE);
        if (from == null && to == null) {
            ApiException.require(Set.of("7", "30", "all").contains(period), "Kỳ báo cáo là 7, 30 hoặc all.");
            if (!"all".equals(period)) { to = today; from = today.minusDays(Integer.parseInt(period) - 1L); }
        }
        ApiException.require(from == null && to == null || from != null && to != null && !from.isAfter(to), "Khoảng ngày không hợp lệ.");
        final LocalDate start = from, end = to;
        return appointments.findAll().stream().filter(a -> {
            LocalDate date = a.getStartTime().toInstant().atZone(ApiViews.ZONE).toLocalDate();
            return start == null || !date.isBefore(start) && !date.isAfter(end);
        }).sorted(Comparator.comparing(Appointment::getStartTime)).collect(Collectors.toList());
    }
    public Map<String, Object> report(String period, LocalDate from, LocalDate to) {
        List<Appointment> rows = rows(period, from, to);
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String status : List.of("pending", "confirmed", "completed", "cancelled", "rejected", "expired")) counts.put(status, 0L);
        Map<String, Long> services = new LinkedHashMap<>();
        Map<LocalDate, Map<String, Object>> daily = new TreeMap<>();
        long revenue = 0;
        for (Appointment a : rows) {
            String status = AppointmentStatus.current(a); counts.merge(status, 1L, Long::sum);
            long total = a.getTotalprice() == null ? 0 : a.getTotalprice().longValue();
            if ("completed".equals(status)) revenue += total;
            boolean counted = !Set.of("cancelled", "rejected", "expired").contains(status);
            if (counted)
                for (AppointmentItem item : ApiViews.items(a)) services.merge(item.getServiceName(), 1L, Long::sum);
            LocalDate date = a.getStartTime().toInstant().atZone(ApiViews.ZONE).toLocalDate();
            Map<String, Object> day = daily.computeIfAbsent(date, d -> new LinkedHashMap<>(Map.of("date", d, "appointments", 0L, "revenue", 0L)));
            if (counted) day.put("appointments", (Long)day.get("appointments") + 1L);
            if ("completed".equals(status)) day.put("revenue", (Long)day.get("revenue") + total);
        }
        Map<String, Object> out = new LinkedHashMap<>(); out.put("totalAppointments", rows.size()); out.put("revenue", revenue);
        out.put("statusCounts", counts); out.put("serviceCounts", services); out.put("daily", daily.values());
        out.put("appointments", rows.stream().map(ApiViews::appointment).collect(Collectors.toList())); return out;
    }
    public String csv(String period, LocalDate from, LocalDate to) {
        List<String> lines = new ArrayList<>(); lines.add("Mã lịch,Ngày,Giờ,Khách hàng,Thú cưng,Dịch vụ,Nhân viên,Tổng (VND),Trạng thái");
        for (Appointment a : rows(period, from, to)) {
            ZonedDateTime time = a.getStartTime().toInstant().atZone(ApiViews.ZONE);
            List<Object> cells = Arrays.asList(a.getReference() == null ? "PP-" + a.getAid() : a.getReference(), time.toLocalDate(), time.toLocalTime(),
                    a.getUser().getName() == null ? a.getUser().getUsername() : a.getUser().getName(), a.getPetName() == null ? a.getPet().getName() : a.getPetName(),
                    ApiViews.serviceNames(a), a.getGroomer().getName(), a.getTotalprice() == null ? 0 : a.getTotalprice().longValue(), AppointmentStatus.current(a));
            lines.add(cells.stream().map(ReportService::cell).collect(Collectors.joining(",")));
        }
        return "\uFEFF" + String.join("\r\n", lines);
    }
    private static String cell(Object value) {
        String s = Objects.toString(value, "");
        if (s.stripLeading().matches("(?s)^[=+@-].*")) s = "'" + s;
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}
