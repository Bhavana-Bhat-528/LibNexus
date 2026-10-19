package com.librarymanagement.controller;

import com.librarymanagement.dto.ApiResponse;
import com.librarymanagement.dto.BorrowRequest;
import com.librarymanagement.dto.ChangePasswordRequest;
import com.librarymanagement.entity.Student;
import com.librarymanagement.entity.Transaction;
import com.librarymanagement.entity.TransactionStatus;
import com.librarymanagement.entity.User;
import com.librarymanagement.exception.BadRequestException;
import com.librarymanagement.repository.TransactionRepository;
import com.librarymanagement.repository.UserRepository;
import com.librarymanagement.security.UserDetailsImpl;
import com.librarymanagement.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/student-portal")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('STUDENT')")
public class StudentPortalController {

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public StudentPortalController(TransactionRepository transactionRepository,
                                   TransactionService transactionService,
                                   UserRepository userRepository,
                                   PasswordEncoder passwordEncoder) {
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private Student getAuthenticatedStudent(UserDetailsImpl userDetails) {
        if (userDetails == null || userDetails.getStudent() == null) {
            throw new BadRequestException("No student profile linked to your user account");
        }
        return userDetails.getStudent();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentDashboard(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Student student = getAuthenticatedStudent(userDetails);
        String usn = student.getUsn();

        List<Transaction> allTransactions = transactionRepository.findByStudentUsnIgnoreCaseOrderByIssueDateDescIdDesc(usn);

        List<Map<String, Object>> activeBorrows = new ArrayList<>();
        double currentEstimatedFines = 0.0;
        long overdueCount = 0;
        LocalDate today = LocalDate.now();

        for (Transaction t : allTransactions) {
            if (t.getStatus() == TransactionStatus.BORROWED) {
                long daysElapsed = ChronoUnit.DAYS.between(t.getIssueDate(), today);
                LocalDate dueDate = t.getIssueDate().plusDays(15);
                double fine = daysElapsed > 15 ? (daysElapsed - 15) * 2.0 : 0.0;
                if (daysElapsed > 15) overdueCount++;
                currentEstimatedFines += fine;

                Map<String, Object> map = new LinkedHashMap<>();
                map.put("transactionId", t.getId());
                map.put("bookId", t.getBook().getId());
                map.put("title", t.getBook().getTitle());
                map.put("author", t.getBook().getAuthor());
                map.put("category", t.getBook().getCategory());
                map.put("issueDate", t.getIssueDate().toString());
                map.put("dueDate", dueDate.toString());
                map.put("daysElapsed", daysElapsed);
                map.put("isOverdue", daysElapsed > 15);
                map.put("daysOverdue", Math.max(0, daysElapsed - 15));
                map.put("fine", fine);
                activeBorrows.add(map);
            }
        }

        int activeCount = activeBorrows.size();
        int remainingQuota = Math.max(0, 3 - activeCount);

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("studentName", student.getName());
        dashboard.put("usn", student.getUsn());
        dashboard.put("contact", student.getContact());
        dashboard.put("activeBorrowsCount", activeCount);
        dashboard.put("remainingQuota", remainingQuota);
        dashboard.put("maxLimit", 3);
        dashboard.put("overdueCount", overdueCount);
        dashboard.put("currentEstimatedFines", currentEstimatedFines);
        dashboard.put("activeBorrows", activeBorrows);

        return ResponseEntity.ok(ApiResponse.success("Student dashboard data retrieved", dashboard));
    }

    @GetMapping("/my-books")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyActiveBooks(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Student student = getAuthenticatedStudent(userDetails);
        List<Transaction> activeTransactions = transactionRepository.findByStudentUsnIgnoreCaseAndStatusOrderByIssueDateDescIdDesc(
                student.getUsn(), TransactionStatus.BORROWED);

        LocalDate today = LocalDate.now();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Transaction t : activeTransactions) {
            long daysElapsed = ChronoUnit.DAYS.between(t.getIssueDate(), today);
            LocalDate dueDate = t.getIssueDate().plusDays(15);
            double fine = daysElapsed > 15 ? (daysElapsed - 15) * 2.0 : 0.0;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("transactionId", t.getId());
            item.put("bookId", t.getBook().getId());
            item.put("title", t.getBook().getTitle());
            item.put("author", t.getBook().getAuthor());
            item.put("category", t.getBook().getCategory());
            item.put("issueDate", t.getIssueDate().toString());
            item.put("dueDate", dueDate.toString());
            item.put("daysElapsed", daysElapsed);
            item.put("isOverdue", daysElapsed > 15);
            item.put("daysOverdue", Math.max(0, daysElapsed - 15));
            item.put("fine", fine);

            result.add(item);
        }

        return ResponseEntity.ok(ApiResponse.success("Active borrowed books retrieved", result));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyReturnHistory(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Student student = getAuthenticatedStudent(userDetails);
        List<Transaction> returnedTransactions = transactionRepository.findByStudentUsnIgnoreCaseAndStatusOrderByIssueDateDescIdDesc(
                student.getUsn(), TransactionStatus.RETURNED);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Transaction t : returnedTransactions) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("transactionId", t.getId());
            item.put("bookId", t.getBook().getId());
            item.put("title", t.getBook().getTitle());
            item.put("author", t.getBook().getAuthor());
            item.put("category", t.getBook().getCategory());
            item.put("issueDate", t.getIssueDate().toString());
            item.put("returnDate", t.getReturnDate() != null ? t.getReturnDate().toString() : "-");
            item.put("finePaid", t.getFine() != null ? t.getFine() : 0.0);
            result.add(item);
        }

        return ResponseEntity.ok(ApiResponse.success("Return history retrieved", result));
    }

    @GetMapping("/penalties")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyPenalties(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Student student = getAuthenticatedStudent(userDetails);
        String usn = student.getUsn();
        LocalDate today = LocalDate.now();

        // 1. Accruing / Unpaid penalties (from currently borrowed books that are overdue)
        List<Transaction> activeTransactions = transactionRepository.findByStudentUsnIgnoreCaseAndStatusOrderByIssueDateDescIdDesc(
                usn, TransactionStatus.BORROWED);

        List<Map<String, Object>> unpaidPenalties = new ArrayList<>();
        double totalUnpaidFines = 0.0;
        long overdueCount = 0;

        for (Transaction t : activeTransactions) {
            long daysElapsed = ChronoUnit.DAYS.between(t.getIssueDate(), today);
            if (daysElapsed > 15) {
                long daysOverdue = daysElapsed - 15;
                double accruedFine = daysOverdue * 2.0;
                overdueCount++;
                totalUnpaidFines += accruedFine;

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("transactionId", t.getId());
                item.put("bookId", t.getBook().getId());
                item.put("title", t.getBook().getTitle());
                item.put("author", t.getBook().getAuthor());
                item.put("category", t.getBook().getCategory());
                item.put("issueDate", t.getIssueDate().toString());
                item.put("dueDate", t.getIssueDate().plusDays(15).toString());
                item.put("daysElapsed", daysElapsed);
                item.put("daysOverdue", daysOverdue);
                item.put("accruedFine", accruedFine);
                unpaidPenalties.add(item);
            }
        }

        // 2. Paid penalties (from returned transactions with fine > 0)
        List<Transaction> returnedTransactions = transactionRepository.findByStudentUsnIgnoreCaseAndStatusOrderByIssueDateDescIdDesc(
                usn, TransactionStatus.RETURNED);

        List<Map<String, Object>> paidPenalties = new ArrayList<>();
        double totalPaidFines = 0.0;

        for (Transaction t : returnedTransactions) {
            double fine = t.getFine() != null ? t.getFine() : 0.0;
            if (fine > 0) {
                totalPaidFines += fine;
                long days = ChronoUnit.DAYS.between(t.getIssueDate(), t.getReturnDate() != null ? t.getReturnDate() : today);
                long daysOverdue = Math.max(0, days - 15);

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("transactionId", t.getId());
                item.put("bookId", t.getBook().getId());
                item.put("title", t.getBook().getTitle());
                item.put("author", t.getBook().getAuthor());
                item.put("category", t.getBook().getCategory());
                item.put("issueDate", t.getIssueDate().toString());
                item.put("returnDate", t.getReturnDate() != null ? t.getReturnDate().toString() : "-");
                item.put("daysBorrowed", days);
                item.put("daysOverdue", daysOverdue);
                item.put("finePaid", fine);
                paidPenalties.add(item);
            }
        }

        Map<String, Object> penaltiesData = new LinkedHashMap<>();
        penaltiesData.put("studentName", student.getName());
        penaltiesData.put("usn", student.getUsn());
        penaltiesData.put("totalUnpaidFines", totalUnpaidFines);
        penaltiesData.put("totalPaidFines", totalPaidFines);
        penaltiesData.put("overdueCount", overdueCount);
        penaltiesData.put("unpaidPenalties", unpaidPenalties);
        penaltiesData.put("paidPenalties", paidPenalties);

        return ResponseEntity.ok(ApiResponse.success("Penalty fees retrieved successfully", penaltiesData));
    }

    @PostMapping("/borrow")
    public ResponseEntity<ApiResponse<List<Transaction>>> borrowBooks(
            @RequestBody BorrowRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Student student = getAuthenticatedStudent(userDetails);
        request.setUsn(student.getUsn());
        request.setStudentName(student.getName());

        List<Transaction> transactions = transactionService.borrowBooks(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Book(s) borrowed successfully.", transactions));
    }

    @PostMapping("/return/{transactionId}")
    public ResponseEntity<Map<String, Object>> returnBook(
            @PathVariable Long transactionId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Student student = getAuthenticatedStudent(userDetails);
        Transaction tx = transactionService.getTransactionById(transactionId);
        if (!tx.getStudent().getUsn().equalsIgnoreCase(student.getUsn())) {
            throw new AccessDeniedException("Access denied: You are not authorized to return a book borrowed by another student.");
        }

        Map<String, Object> result = transactionService.returnBookByTransactionId(transactionId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Student student = getAuthenticatedStudent(userDetails);
        int activeCount = transactionRepository.countByStudentUsnIgnoreCaseAndStatus(student.getUsn(), TransactionStatus.BORROWED);

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", student.getId());
        profile.put("name", student.getName());
        profile.put("usn", student.getUsn());
        profile.put("contact", student.getContact());
        profile.put("username", userDetails.getUsername());
        profile.put("activeBooksCount", activeCount);
        profile.put("remainingQuota", Math.max(0, 3 - activeCount));

        return ResponseEntity.ok(ApiResponse.success("Student profile retrieved", profile));
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("New password cannot be empty"));
        }
        if (request.getNewPassword().trim().length() < 4) {
            return ResponseEntity.badRequest().body(ApiResponse.error("New password must be at least 4 characters long"));
        }
        if (request.getConfirmPassword() != null && !request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("New password and confirm password do not match"));
        }

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (request.getCurrentPassword() != null && !request.getCurrentPassword().isEmpty()) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect"));
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Password updated successfully!"));
    }
}
