package com.salon.service_offering.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public class BaseModels {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public BaseModels(Long id, Date lastModifiedAt, Date generatedDate) {
        this.id = id;
        this.lastModifiedAt = lastModifiedAt;
        this.generatedDate = generatedDate;
    }

    @CreatedDate
    @Temporal(value = TemporalType.DATE)
    private Date generatedDate;

    @LastModifiedDate
    @Temporal(value = TemporalType.DATE)
    private Date lastModifiedAt;

    public BaseModels() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Date getGeneratedDate() {
        return generatedDate;
    }

    public void setGeneratedDate(Date generatedDate) {
        this.generatedDate = generatedDate;
    }

    public Date getLastModifiedAt() {
        return lastModifiedAt;
    }

    public void setLastModifiedAt(Date lastModifiedAt) {
        this.lastModifiedAt = lastModifiedAt;
    }
}
