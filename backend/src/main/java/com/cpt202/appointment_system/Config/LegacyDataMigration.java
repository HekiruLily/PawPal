package com.cpt202.appointment_system.Config;

import java.util.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import com.cpt202.appointment_system.Common.ApiViews;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.AppointmentRepo;

/** Idempotent, additive backfill. Never recalculates booked prices from today's price list. */
@Component
public class LegacyDataMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final AppointmentRepo appointments;
    public LegacyDataMigration(JdbcTemplate jdbc, AppointmentRepo appointments) { this.jdbc = jdbc; this.appointments = appointments; }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        // Hibernate 5 adds columns in update mode but does not reliably widen legacy columns.
        jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            if (connection.getMetaData().getDatabaseProductName().equalsIgnoreCase("MySQL")) {
                boolean widenGroomerPhone = false;
                try (java.sql.ResultSet columns = connection.getMetaData().getColumns(connection.getCatalog(), null, "groomer", "phone_number")) {
                    if (columns.next()) widenGroomerPhone = columns.getInt("COLUMN_SIZE") < 20;
                }
                if (widenGroomerPhone) try (java.sql.Statement statement = connection.createStatement()) {
                    statement.execute("alter table groomer modify column phone_number varchar(20) null");
                }
                for (String column : List.of("password", "phone_number")) {
                    int length = column.equals("password") ? 100 : 20;
                    boolean widen = false;
                    try (java.sql.ResultSet columns = connection.getMetaData().getColumns(connection.getCatalog(), null, "user", column)) {
                        if (columns.next()) widen = columns.getInt("COLUMN_SIZE") < length;
                    }
                    if (widen) try (java.sql.Statement statement = connection.createStatement()) {
                        statement.execute("alter table `user` modify column `" + column + "` varchar(" + length + ") " + (column.equals("password") ? "not null" : "null"));
                    }
                }
            }
            return null;
        });
        jdbc.update("update appointment set version = 0 where version is null");
        for (Appointment a : appointments.findAll()) {
            if (a.getReference() == null) a.setReference("PP-" + a.getAid());
            if (a.getPetName() == null) a.setPetName(a.getPet().getName());
            if (a.getEditCount() == null) a.setEditCount(0);
            if (a.getItems().isEmpty()) {
                // Capture legacy values once so later catalog edits cannot change history.
                AppointmentItem item = ApiViews.items(a).get(0);
                a.getItems().add(item);
                a.setDurationMinutes(item.getDuration());
                a.setSubtotal(item.getPrice()); a.setDiscount(0L);
            }
        }
    }
}
