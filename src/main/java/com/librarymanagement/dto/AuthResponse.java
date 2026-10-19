package com.librarymanagement.dto;

import com.librarymanagement.entity.Role;

public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String role;
    private Long studentId;
    private String studentName;
    private String studentUsn;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long id, String username, String role,
                        Long studentId, String studentName, String studentUsn) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.role = role;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentUsn = studentUsn;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role != null ? role.name() : null;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentUsn() {
        return studentUsn;
    }

    public void setStudentUsn(String studentUsn) {
        this.studentUsn = studentUsn;
    }
}
