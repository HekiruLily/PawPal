package com.cpt202.appointment_system.Repositories;

import java.util.Optional;
import javax.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import com.cpt202.appointment_system.Models.PasswordReset;

public interface PasswordResetRepo extends JpaRepository<PasswordReset, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PasswordReset p where p.userId = ?1")
    Optional<PasswordReset> lockByUserId(Integer id);
}
