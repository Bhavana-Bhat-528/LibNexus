package com.librarymanagement.controller;

import com.librarymanagement.dto.ApiResponse;
import com.librarymanagement.dto.BorrowRequest;
import com.librarymanagement.dto.ReturnRequest;
import com.librarymanagement.entity.Transaction;
import com.librarymanagement.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<List<Transaction>>> borrowBooks(@RequestBody BorrowRequest request) {
        List<Transaction> transactions = transactionService.borrowBooks(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Book(s) borrowed successfully.", transactions));
    }

    /**
     * Return Book API using Transaction ID path variable: POST /api/transactions/return/{transactionId}
     */
    @PostMapping("/return/{transactionId}")
    public ResponseEntity<Map<String, Object>> returnBookByPathId(@PathVariable Long transactionId) {
        Map<String, Object> result = transactionService.returnBookByTransactionId(transactionId);
        return ResponseEntity.ok(result);
    }

    /**
     * Return Book API using Request Body: POST /api/transactions/return
     */
    @PostMapping("/return")
    public ResponseEntity<Map<String, Object>> returnBook(@RequestBody ReturnRequest request) {
        Map<String, Object> result = transactionService.returnBook(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping
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

    @GetMapping("/student/{usn}")
    public ResponseEntity<ApiResponse<List<Transaction>>> getStudentTransactions(@PathVariable String usn) {
        List<Transaction> transactions = transactionService.getTransactionsByStudent(usn);
        return ResponseEntity.ok(ApiResponse.success("Student borrowing history retrieved", transactions));
    }
}
