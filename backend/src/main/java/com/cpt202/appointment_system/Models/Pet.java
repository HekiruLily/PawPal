package com.cpt202.appointment_system.Models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import lombok.Data;

@Data
@Entity
public class Pet {
    @Column(length = 260, unique = true)
    private String firebaseKey;
    private String breed;
    private Integer age;
    private String gender;
    @Column(length = 300)
    private String notes;
    private Boolean deleted = false;


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "int(7)")
    private Integer pid;

    @Column(columnDefinition = "varchar(10)", nullable = false)
    private String size;
    
    //pet size including "small","medium","large"
    @Column(columnDefinition = "varchar(50)", nullable = false)
    @com.fasterxml.jackson.annotation.JsonAlias("species")
    private String type;

    @Column(columnDefinition = "varchar(50)", nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @Column(name = "image_url", length = 2048, nullable = true)
    private String imageURL;

    public Pet(Integer pid) {
        this.pid = pid;
    }

    public Pet() {
    }
    
    
}
