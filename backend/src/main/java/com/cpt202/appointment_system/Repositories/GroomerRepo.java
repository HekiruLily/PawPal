package com.cpt202.appointment_system.Repositories;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.cpt202.appointment_system.Models.Groomer;
import org.springframework.data.jpa.repository.Query;


public interface GroomerRepo extends JpaRepository<Groomer, Integer>{
    @org.springframework.data.jpa.repository.Lock(javax.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from Groomer g order by g.gid")
    List<Groomer> lockSchedule();


    public Groomer findByGid(Integer gid);
    
    // groomer can be searched by name
    public List<Groomer> findByNameContaining(String name);

    public Groomer findByPhoneNumber(String phoneNumber);

    public List<Groomer> findByNameIs(String name);
    public List<Groomer> findByRankIs(Integer rank);
    public List<Groomer> findByPhoneNumberIs(String phoneNumber);

    public List<Groomer> findAll();

    @Transactional
    @Modifying
    @Query(value = "DELETE FROM `groomer` WHERE gid = ?1", nativeQuery = true)
    public void deleteByGid(Integer gid);
}
