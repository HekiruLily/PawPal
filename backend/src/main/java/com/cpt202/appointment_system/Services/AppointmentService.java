package com.cpt202.appointment_system.Services;

import java.sql.Date;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;

import com.cpt202.appointment_system.Common.Result;
import com.cpt202.appointment_system.Models.Appointment;
import com.cpt202.appointment_system.Models.Groomer;
import com.cpt202.appointment_system.Models.Pet;
import com.cpt202.appointment_system.Models.ServiceType;
import com.cpt202.appointment_system.Models.User;
import com.cpt202.appointment_system.Repositories.AppointmentRepo;
import com.cpt202.appointment_system.Repositories.GroomerRepo;
import com.cpt202.appointment_system.Repositories.PetRepo;
import com.cpt202.appointment_system.Repositories.UserRepo;
import com.cpt202.appointment_system.Repositories.ServiceTypeRepo;
import java.math.BigInteger;

@Service
public class AppointmentService {
    @Autowired private BookingService booking;
    @Autowired private SessionService sessions;


	@Autowired
	private UserRepo userRepo;

	@Autowired
	private GroomerRepo groomerRepo;

	@Autowired
	private AppointmentRepo appointmentRepo;

	@Autowired
	private PetRepo petRepo;

	@Autowired
	private GroomerRepo groRepo;

	@Autowired
	private ServiceTypeRepo serviceTypeRepo;

	/*
	 * Manager Part
	 * This is a part to fullfill all the functions of managers.
	 */

	// WJT Manger Part
	// Fiter Fuction
	public List<Appointment> getAppointmentBy_CName(@RequestParam String username) {

		List<User> userList = userRepo.findByUsernameContaining(username);
		User findUser = userList.get(0);
		return appointmentRepo.findByUser(findUser);
		// userRepo.findByUsernameContaining(appointment.getUser().getUsername());

	}

	public List<Appointment> getAppointmentBy_Service(@RequestParam String servicetype) {
		return appointmentRepo.findByserviceType(servicetype);
	}

	public List<Appointment> getAppointmentBy_GroomerName(@RequestParam String grommername) {
		List<Groomer> groList = groRepo.findByNameContaining(grommername);
		Groomer findGroomer = groList.get(0);
		return appointmentRepo.findByGroomer(findGroomer);
	}

	// YYY
	public Appointment getAppointmentBy_Aid(@RequestParam int aid) {
		booking.detail(sessions.current(), aid);
		Appointment appointmentDetail = appointmentRepo.findByAid(aid);

		return appointmentDetail;
	}

	/*
	 * Customer Part
	 */
	// YYY
	public List<Appointment> appointmentSearch(@RequestParam String keyword) {
		List<Appointment> resulList = new ArrayList<>();
		if (isInteger(keyword)) {
			Appointment resulList_aid = appointmentRepo.findByAid(Integer.valueOf(keyword).intValue());
			List<Appointment> resulList_gid = appointmentRepo.findByGroomer(Integer.valueOf(keyword).intValue());
			List<Appointment> resulList_sid = appointmentRepo.findBySid(Integer.valueOf(keyword).intValue());
			List<Appointment> resulList_price = appointmentRepo.findBytotalPrice(Double.valueOf(keyword));

			if (resulList_aid != null)
				resulList.add(resulList_aid);
			if (resulList_gid != null)
				resulList.addAll(resulList_gid);
			if (resulList_sid != null)
				resulList.addAll(resulList_sid);
			if (resulList_price != null)
				resulList.addAll(resulList_price);
		}
		LinkedHashSet<Appointment> hashSet = new LinkedHashSet<>(resulList);
		ArrayList<Appointment> resulList_Final = new ArrayList<>(hashSet);
		return resulList_Final;
	}

	public Result<?> getAppointmentBy_Uid(@RequestParam User user) {
		// return appointmentRepo.findByUser(user);
		// return appointmentRepo.findByUsernameIs(user.getUsername());

		List<Appointment> appointmentList = userRepo.findByUidIs(user.getUid());
		if (!appointmentList.isEmpty()) {
			return Result.success(appointmentList, "Find Matching Customer!");
		}

		return Result.error("-1", "No Matching Customers Found.");
	}

	// YYY (modified by ZYH)
	public Result<?> getAppointmentDetail_C(@RequestParam User user) {
		Appointment appointment1 = appointmentRepo.findByAid(user.getUid());
		if (appointment1 != null)
			return Result.success(appointment1, "Find Matching Appointment!");
		return Result.error("-1", "No Matching Appointment Found.");
	}

	/* ZYH */
	// TODO : para name to be uniformed
	// YYY - Manager can view all appointments
	public List<Appointment> listAllAppointments() {
		User actor = sessions.current();
		List<Appointment> appointmentList = Integer.valueOf(1).equals(actor.getType()) ? appointmentRepo.findAll() : appointmentRepo.findByUser(actor);
		return appointmentList;
	}

	// ZYH : Customer can search appointment by user name
	public Result<?> getAppointmentListByUserName_C(@RequestParam String username) {
		List<Appointment> appointmentList = appointmentRepo.findByUser(sessions.current());
		if (!appointmentList.isEmpty()) {
			return Result.success(appointmentList, "Find Matching Appointment!");
		}
		return Result.error("-1", "No Matching Appointment Found.");
	}

	// Bowen li's modification
	// Customer can make appointment when fill in all feilds
    @org.springframework.transaction.annotation.Transactional
    public Result<?> makeAppointment_C(Appointment a) {
        com.cpt202.appointment_system.Models.BookingForm form = legacyForm(a);
        User actor = sessions.current();
        java.util.Map<String, Object> quote = booking.quote(actor, form);
        form.setExpectedTotal((Long)quote.get("totalPrice")); form.setExpectedDuration((Integer)quote.get("durationMinutes"));
        return Result.success(booking.create(actor, form), "Đã gửi yêu cầu đặt lịch.");
    }
    private com.cpt202.appointment_system.Models.BookingForm legacyForm(Appointment a) {
        com.cpt202.appointment_system.Models.BookingForm f = new com.cpt202.appointment_system.Models.BookingForm();
        if (a.getPet() == null || a.getServiceType() == null || a.getStartTime() == null) throw new com.cpt202.appointment_system.Common.ApiException(400, "Thiếu thông tin đặt lịch.");
        f.setPetId(a.getPet().getPid()); f.setServiceIds(java.util.List.of(a.getServiceType().getSid()));
        f.setGroomerId(a.getGroomer() == null ? null : a.getGroomer().getGid());
        // Legacy datetime-local is a shop-local wall time, not an instant from the device.
        f.setStartTime(a.getStartTime().toLocalDateTime().atZone(com.cpt202.appointment_system.Common.ApiViews.ZONE).toOffsetDateTime());
        return f;
    }

	public static boolean isOverlap(Timestamp start1, Timestamp end1, Timestamp start2, Timestamp end2) {
		if (start1.before(end2) && start2.before(end1)) {
			return true;
		} else {
			return false;
		}
	}

	// ZYH PBI NO.i : Customer can cancel appointment
    public Result<?> cancelAppointment_C(int aid) {
        Appointment a = appointmentRepo.findByAid(aid);
        if (a == null) throw new com.cpt202.appointment_system.Common.ApiException(404, "Không tìm thấy lịch hẹn.");
        return Result.success(booking.cancel(sessions.current(), aid, a.getVersion()), "Đã hủy lịch.");
    }
    public Result<?> modifyAppointment_C(Appointment a) {
        Appointment existing = appointmentRepo.findByAid(a.getAid());
        if (existing == null) throw new com.cpt202.appointment_system.Common.ApiException(404, "Không tìm thấy lịch hẹn.");
        com.cpt202.appointment_system.Models.BookingForm form = legacyForm(a);
        User user = sessions.current(); java.util.Map<String, Object> quote = booking.quote(user, form);
        form.setExpectedTotal((Long)quote.get("totalPrice")); form.setExpectedDuration((Integer)quote.get("durationMinutes")); form.setVersion(existing.getVersion());
        return Result.success(booking.edit(user, a.getAid(), form), "Đã sửa lịch.");
    }

	// TODO : Not necessary for now
	// // ZYH PBI NO.ii : Customer can filter appointment by time
	// public Result<?> getAppointmentListByTime_C(@RequestParam String time) {
	// List<Appointment> appointmentList =
	// appointmentRepo.findByTimeContaining(time);
	// if (!appointmentList.isEmpty()) {
	// return Result.success(appointmentList, "Find Matching Appointment!");
	// }
	// return Result.error("-1", "No Matching Appointment Found.");
	// }

	public List<Appointment> searchAppointmentByUsername(String name) {
		return appointmentRepo.findByUserContaining(name);
	}

	public Result<?> getAppointmentDetail_M(@RequestParam Appointment appointment) {
		Appointment appointment1 = appointmentRepo.findByAid(appointment.getAid());
		if (appointment1 != null)
			return Result.success(appointment1, "Find Matching Appointment!");
		return Result.error("-1", "No Matching Appointment Found.");
	}

	public static boolean isInteger(String str) {
		Pattern pattern = Pattern.compile("^[-\\+]?[\\d]*$");
		return pattern.matcher(str).matches();
	}

	public List<Appointment> appointmentSearch_M(@RequestParam String keyword) {
		List<Appointment> resulList = new ArrayList<>();
		// if (isInteger(keyword)) {
		// 	Appointment resulList_aid = appointmentRepo.findByAid(Integer.valueOf(keyword).intValue());
		// 	List<Appointment> resultList_gid = appointmentRepo.findByGroomer(Integer.valueOf(keyword).intValue());
		// 	List<Appointment> resultList_sid = appointmentRepo.findBySid(Integer.valueOf(keyword).intValue());
		// 	List<Appointment> resultList_price = appointmentRepo.findBytotalPrice(Double.valueOf(keyword));

		// 	if (resulList_aid != null)
		// 		resulList.add(resulList_aid);
		// 	if (resultList_gid != null)
		// 		resulList.addAll(resultList_gid);
		// 	if (resultList_sid != null)
		// 		resulList.addAll(resultList_sid);
		// 	if (resultList_price != null)
		// 		resulList.addAll(resultList_price);

		// }
		// List<Appointment> resulList_status = appointmentRepo.findByStatus(keyword);
		Optional<User> user = userRepo.findByUsernameOptional(keyword);
		try {
			Integer uid = user.get().getUid();
			List<Appointment> resultList_username = appointmentRepo.findByUid(uid);
			if (resultList_username != null)
				resulList.addAll(resultList_username);
		} catch (NoSuchElementException nse) {
			System.out.println(nse.getMessage());
		}
		// if (resulList_status != null)
		// 	resulList.addAll(resulList_status);

		LinkedHashSet<Appointment> hashSet = new LinkedHashSet<>(resulList);
		ArrayList<Appointment> resulList_Final = new ArrayList<>(hashSet);
		return resulList_Final;
	}

	public List<Appointment> getAppointmentList_M() {
		return appointmentRepo.findAll();
	}

    public void updateAppointment(Appointment a) {
        Appointment existing = appointmentRepo.findByAid(a.getAid());
        if (existing == null) throw new com.cpt202.appointment_system.Common.ApiException(404, "Không tìm thấy lịch hẹn.");
        booking.transition(sessions.current(), a.getAid(), a.getStatus(), null, existing.getVersion());
    }

	public List<Appointment> getAllAppointments() {
		return appointmentRepo.findAll();
	}

	public List<Appointment> findAllSale() {
		return appointmentRepo.findAll().stream().filter(a -> "completed".equals(com.cpt202.appointment_system.Common.AppointmentStatus.current(a))).collect(Collectors.toList());
	}

    public List<Object[]> getAnnualStaticalReport() {
        java.util.Map<Integer, Double> sums = new java.util.TreeMap<>();
        for (Appointment a : findAllSale()) {
            int year = a.getStartTime().toInstant().atZone(com.cpt202.appointment_system.Common.ApiViews.ZONE).getYear();
            sums.merge(year, a.getTotalprice() == null ? 0.0 : a.getTotalprice(), Double::sum);
        }
        return sums.entrySet().stream().map(e -> new Object[]{e.getKey(), e.getValue()}).collect(Collectors.toList());
    }
    public List<Object[]> getQuarterlyStaticalReport(int year) {
        double[] sums = new double[4];
        for (Appointment a : findAllSale()) {
            java.time.ZonedDateTime date = a.getStartTime().toInstant().atZone(com.cpt202.appointment_system.Common.ApiViews.ZONE);
            if (date.getYear() == year) sums[(date.getMonthValue()-1)/3] += a.getTotalprice() == null ? 0.0 : a.getTotalprice();
        }
        java.util.List<Object[]> result = new java.util.ArrayList<>();
        for (int q=0; q<4; q++) result.add(new Object[]{q+1,sums[q]});
        return result;
    }
}
