package com.librarymanagement.dto;

import com.librarymanagement.entity.Transaction;
import java.util.List;

public class DashboardStatsDto {
    private long totalBooks;
    private long totalAvailableCopies;
    private long totalStudents;
    private long currentlyBorrowedBooks;
    private long returnedBooks;
    private long pendingReturns;
    private double totalFinesCollected;
    private List<Transaction> recentTransactions;

    public DashboardStatsDto() {
    }

    public long getTotalBooks() {
        return totalBooks;
    }

    public void setTotalBooks(long totalBooks) {
        this.totalBooks = totalBooks;
    }

    public long getTotalAvailableCopies() {
        return totalAvailableCopies;
    }

    public void setTotalAvailableCopies(long totalAvailableCopies) {
        this.totalAvailableCopies = totalAvailableCopies;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getCurrentlyBorrowedBooks() {
        return currentlyBorrowedBooks;
    }

    public void setCurrentlyBorrowedBooks(long currentlyBorrowedBooks) {
        this.currentlyBorrowedBooks = currentlyBorrowedBooks;
    }

    public long getReturnedBooks() {
        return returnedBooks;
    }

    public void setReturnedBooks(long returnedBooks) {
        this.returnedBooks = returnedBooks;
    }

    public long getPendingReturns() {
        return pendingReturns;
    }

    public void setPendingReturns(long pendingReturns) {
        this.pendingReturns = pendingReturns;
    }

    public double getTotalFinesCollected() {
        return totalFinesCollected;
    }

    public void setTotalFinesCollected(double totalFinesCollected) {
        this.totalFinesCollected = totalFinesCollected;
    }

    public List<Transaction> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<Transaction> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }
}
