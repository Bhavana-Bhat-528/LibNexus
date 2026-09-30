package com.librarymanagement.dto;

public class ReturnRequest {
    private Long transactionId;
    private String usn;
    private Long bookId;
    private String bookTitle;

    public ReturnRequest() {
    }

    public ReturnRequest(Long transactionId) {
        this.transactionId = transactionId;
    }

    public ReturnRequest(String usn, Long bookId) {
        this.usn = usn;
        this.bookId = bookId;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public String getUsn() {
        return usn;
    }

    public void setUsn(String usn) {
        this.usn = usn;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public String getBookTitle() {
        return bookTitle;
    }

    public void setBookTitle(String bookTitle) {
        this.bookTitle = bookTitle;
    }
}
