package com.cpt202.appointment_system.Repositories;

import java.util.List;
import java.util.Optional;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import com.cpt202.appointment_system.Models.Appointment;

// import com.cpt202.appointment_system.Models.Appointment;
import com.cpt202.appointment_system.Models.User;

public interface UserRepo extends JpaRepository<User, Integer> {
    java.util.Optional<User> findByFirebaseUid(String firebaseUid);
    @org.springframework.data.jpa.repository.Lock(javax.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.uid = ?1")
    java.util.Optional<User> lockByUid(Integer id);


    @org.springframework.data.jpa.repository.Lock(javax.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.username = ?1")
    java.util.Optional<User> lockByUsername(String name);
    @org.springframework.data.jpa.repository.Lock(javax.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.email = ?1")
    java.util.Optional<User> lockByEmail(String email);
    public List<User> findByType(Integer type);

    public List<User> findByUsernameContaining(String username);

    public User findByUid(Integer uid);

    public boolean existsByUsername(String username);

    public boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.username = ?1")
    Optional<User> findByUsernameOptional(String username);


    public User findByUsername(String username);

    @Query("select a from Appointment a where a.user.uid = ?1")
    public List<Appointment> findByUidIs(Integer uid);
    // return the appointment list with a specific username
    // public List<Appointment> findByUidIs(Integer uid);

    @Query("SELECT u FROM User u WHERE u.email = ?1")
    public Optional<User> findByEmail(String email);

    @Transactional
    @Modifying
    @Query(value = "DELETE FROM `user` WHERE uid = ?1", nativeQuery = true)
    public void deleteByUid(Integer uid);
}
