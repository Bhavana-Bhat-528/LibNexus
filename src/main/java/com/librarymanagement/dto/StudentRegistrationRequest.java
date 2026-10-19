package com.librarymanagement.dto;

public class StudentRegistrationRequest {
    private Long id;
    private String name;
    private String usn;
    private String contact;
    private String username;
    private String password;

    public StudentRegistrationRequest() {
    }

    public StudentRegistrationRequest(String name, String usn, String contact, String username, String password) {
        this.name = name;
        this.usn = usn;
        this.contact = contact;
        this.username = username;
        this.password = password;
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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
