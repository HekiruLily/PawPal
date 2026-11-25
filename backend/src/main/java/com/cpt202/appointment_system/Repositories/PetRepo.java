package com.cpt202.appointment_system.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cpt202.appointment_system.Models.Pet;
import com.cpt202.appointment_system.Models.User;

public interface PetRepo extends JpaRepository<Pet, Integer>{
    java.util.Optional<Pet> findByFirebaseKey(String firebaseKey);
    long countByDeletedFalseOrDeletedIsNull();

    @org.springframework.data.jpa.repository.Lock(javax.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Pet p where p.pid = ?1")
    java.util.Optional<Pet> lockById(Integer pid);

    
    public List<Pet> findByUser(User user);

    public Pet  findByPid(Integer pid);
    
}
