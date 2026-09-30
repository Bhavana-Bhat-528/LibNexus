package com.librarymanagement.dto;

import java.util.ArrayList;
import java.util.List;

public class BorrowRequest {
    private String usn;
    private String studentName;
    private List<Long> bookIds = new ArrayList<>();
    private List<String> bookTitles = new ArrayList<>();

    public BorrowRequest() {
    }

    public BorrowRequest(String usn, List<Long> bookIds) {
        this.usn = usn;
        this.bookIds = bookIds;
    }

    public String getUsn() {
        return usn;
    }

    public void setUsn(String usn) {
        this.usn = usn;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public List<Long> getBookIds() {
        return bookIds;
    }

    public void setBookIds(List<Long> bookIds) {
        this.bookIds = bookIds;
    }

    public List<String> getBookTitles() {
        return bookTitles;
    }

    public void setBookTitles(List<String> bookTitles) {
        this.bookTitles = bookTitles;
    }
}
