package com.librarymanagement.dto;

import com.librarymanagement.entity.Student;

public class StudentDto {
    private Long id;
    private String name;
    private String usn;
    private String contact;
    private int activeBooksCount;
    private int remainingBorrowLimit;
    private String username;
    private boolean hasLoginAccount;

    public StudentDto() {
    }

    public StudentDto(Student student, int activeBooksCount) {
        this.id = student.getId();
        this.name = student.getName();
        this.usn = student.getUsn();
        this.contact = student.getContact();
        this.activeBooksCount = activeBooksCount;
        this.remainingBorrowLimit = Math.max(0, 3 - activeBooksCount);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsn() {
        return usn;
    }

    public void setUsn(String usn) {
        this.usn = usn;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public int getActiveBooksCount() {
        return activeBooksCount;
    }

    public void setActiveBooksCount(int activeBooksCount) {
        this.activeBooksCount = activeBooksCount;
    }

    public int getRemainingBorrowLimit() {
        return remainingBorrowLimit;
    }

    public void setRemainingBorrowLimit(int remainingBorrowLimit) {
        this.remainingBorrowLimit = remainingBorrowLimit;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public boolean isHasLoginAccount() {
        return hasLoginAccount;
    }

    public void setHasLoginAccount(boolean hasLoginAccount) {
        this.hasLoginAccount = hasLoginAccount;
    }
}
