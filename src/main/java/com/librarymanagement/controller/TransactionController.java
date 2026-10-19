package com.librarymanagement.controller;

import com.librarymanagement.dto.ApiResponse;
import com.librarymanagement.dto.BorrowRequest;
import com.librarymanagement.dto.ReturnRequest;
import com.librarymanagement.entity.Role;
import com.librarymanagement.entity.Transaction;
import com.librarymanagement.exception.BadRequestException;
import com.librarymanagement.security.UserDetailsImpl;
import com.librarymanagement.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    @Autowired
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/borrow")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<Transaction>>> borrowBooks(
            @RequestBody BorrowRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // If logged in as student, enforce their own identity
        if (userDetails != null && userDetails.getRole() == Role.ROLE_STUDENT) {
            if (userDetails.getStudent() == null) {
                throw new BadRequestException("No student profile linked to your user account");
            }
            request.setUsn(userDetails.getStudent().getUsn());
            request.setStudentName(userDetails.getStudent().getName());
        }

        List<Transaction> transactions = transactionService.borrowBooks(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Book(s) borrowed successfully.", transactions));
    }

    /**
     * Return Book API using Transaction ID path variable: POST /api/transactions/return/{transactionId}
     */
    @PostMapping("/return/{transactionId}")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'STUDENT')")
    public ResponseEntity<Map<String, Object>> returnBookByPathId(
            @PathVariable Long transactionId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails != null && userDetails.getRole() == Role.ROLE_STUDENT) {
            if (userDetails.getStudent() == null) {
                throw new BadRequestException("No student profile linked to your user account");
            }
            Transaction tx = transactionService.getTransactionById(transactionId);
            if (!tx.getStudent().getUsn().equalsIgnoreCase(userDetails.getStudent().getUsn())) {
                throw new AccessDeniedException("Access denied: You are not authorized to return a book borrowed by another student.");
            }
        }

        Map<String, Object> result = transactionService.returnBookByTransactionId(transactionId);
        return ResponseEntity.ok(result);
    }

    /**
     * Return Book API using Request Body: POST /api/transactions/return
     */
    @PostMapping("/return")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'STUDENT')")
    public ResponseEntity<Map<String, Object>> returnBook(
            @RequestBody ReturnRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails != null && userDetails.getRole() == Role.ROLE_STUDENT) {
            if (userDetails.getStudent() == null) {
                throw new BadRequestException("No student profile linked to your user account");
            }
            if (request.getTransactionId() != null) {
                Transaction tx = transactionService.getTransactionById(request.getTransactionId());
                if (!tx.getStudent().getUsn().equalsIgnoreCase(userDetails.getStudent().getUsn())) {
                    throw new AccessDeniedException("Access denied: You are not authorized to return a book borrowed by another student.");
                }
            }
            request.setUsn(userDetails.getStudent().getUsn());
        }

        Map<String, Object> result = transactionService.returnBook(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<Transaction>>> getTransactions(
            @RequestParam(required = false) String usn,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        List<Transaction> transactions;
        if (usn != null || status != null || search != null) {
            transactions = transactionService.filterTransactions(usn, status, search);
        } else {
            transactions = transactionService.getAllTransactions();
        }
        return ResponseEntity.ok(ApiResponse.success("Transactions retrieved successfully", transactions));
    }

    @GetMapping("/penalties")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPenaltiesReport() {
        Map<String, Object> report = transactionService.getPenaltiesReport();
        return ResponseEntity.ok(ApiResponse.success("Penalties report retrieved successfully", report));
    }

    @GetMapping("/student/{usn}")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<Transaction>>> getStudentTransactions(
            @PathVariable String usn,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        // If user is STUDENT, ensure they can only query their own records
        if (userDetails != null && userDetails.getRole() == Role.ROLE_STUDENT) {
            if (userDetails.getStudent() == null || !userDetails.getStudent().getUsn().equalsIgnoreCase(usn)) {
                throw new AccessDeniedException("Access denied: You are not authorized to view another student's transactions.");
            }
        }

        List<Transaction> transactions = transactionService.getTransactionsByStudent(usn);
        return ResponseEntity.ok(ApiResponse.success("Student borrowing history retrieved", transactions));
    }
}
