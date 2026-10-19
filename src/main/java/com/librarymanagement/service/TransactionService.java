package com.librarymanagement.service;

import com.librarymanagement.dto.BorrowRequest;
import com.librarymanagement.dto.DashboardStatsDto;
import com.librarymanagement.dto.ReturnRequest;
import com.librarymanagement.entity.Book;
import com.librarymanagement.entity.Student;
import com.librarymanagement.entity.Transaction;
import com.librarymanagement.entity.TransactionStatus;
import com.librarymanagement.exception.BadRequestException;
import com.librarymanagement.exception.ResourceNotFoundException;
import com.librarymanagement.repository.BookRepository;
import com.librarymanagement.repository.StudentRepository;
import com.librarymanagement.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class TransactionService {

    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final StudentRepository studentRepository;
    private final BookRepository bookRepository;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository,
                              StudentRepository studentRepository,
                              BookRepository bookRepository) {
        this.transactionRepository = transactionRepository;
        this.studentRepository = studentRepository;
        this.bookRepository = bookRepository;
    }

    @Transactional
    public List<Transaction> borrowBooks(BorrowRequest request) {
        if (request.getUsn() == null || request.getUsn().trim().isEmpty()) {
            throw new BadRequestException("Student USN is required for borrowing books");
        }

        String usn = request.getUsn().trim().toUpperCase();

        // 1. Find or create student
        Student student = studentRepository.findByUsnIgnoreCase(usn)
                .orElseGet(() -> {
                    if (request.getStudentName() != null && !request.getStudentName().trim().isEmpty()) {
                        Student newStudent = new Student(
                                request.getStudentName().trim(),
                                usn,
                                "N/A"
                        );
                        return studentRepository.save(newStudent);
                    }
                    throw new ResourceNotFoundException("Student not found with USN: " + usn);
                });

        // Collect requested books (by IDs or Titles)
        List<Book> booksToBorrow = new ArrayList<>();

        if (request.getBookIds() != null && !request.getBookIds().isEmpty()) {
            for (Long bookId : request.getBookIds()) {
                if (bookId != null) {
                    Book book = bookRepository.findById(bookId)
                            .orElseThrow(() -> new ResourceNotFoundException("Book not found with ID: " + bookId));
                    booksToBorrow.add(book);
                }
            }
        } else if (request.getBookTitles() != null && !request.getBookTitles().isEmpty()) {
            for (String title : request.getBookTitles()) {
                if (title != null && !title.trim().isEmpty()) {
                    Book book = bookRepository.findByTitleIgnoreCase(title.trim())
                            .orElseThrow(() -> new ResourceNotFoundException("Book not found with title: '" + title + "'"));
                    booksToBorrow.add(book);
                }
            }
        }

        if (booksToBorrow.isEmpty()) {
            throw new BadRequestException("Please select at least one book to borrow");
        }

        // 2. Prevent duplicate active borrows for the exact same book
        for (Book book : booksToBorrow) {
            boolean alreadyBorrowed = transactionRepository.existsByStudentUsnIgnoreCaseAndBookIdAndStatus(
                    usn, book.getId(), TransactionStatus.BORROWED);
            if (alreadyBorrowed) {
                throw new BadRequestException("Student " + student.getName() + " (" + usn + ") has already borrowed the book '" +
                        book.getTitle() + "'. Please return the existing copy before borrowing it again.");
            }
        }

        // 3. Check current active borrows for this student
        int currentActiveCount = transactionRepository.countByStudentUsnIgnoreCaseAndStatus(usn, TransactionStatus.BORROWED);

        // 4. Enforce maximum 3 active books rule strictly
        if (currentActiveCount + booksToBorrow.size() > 3) {
            throw new BadRequestException("Limit exceeded! Student already has " + currentActiveCount +
                    " active borrowed book(s). Attempting to borrow " + booksToBorrow.size() +
                    " more will exceed the maximum allowed limit of 3 books.");
        }

        // 5. Verify book stock availability
        for (Book book : booksToBorrow) {
            if (book.getAvailableCopies() <= 0) {
                throw new BadRequestException("Book '" + book.getTitle() + "' is currently out of stock.");
            }
        }

        // 6. Execute borrow transactions and update inventory
        List<Transaction> createdTransactions = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Book book : booksToBorrow) {
            book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
            bookRepository.save(book);

            Transaction transaction = new Transaction(student, book, today, TransactionStatus.BORROWED);
            createdTransactions.add(transactionRepository.save(transaction));
        }

        return createdTransactions;
    }

    /**
     * Primary Return API Method: Returns a book using the exact Transaction ID primary key.
     */
    @Transactional
    public Map<String, Object> returnBookByTransactionId(Long transactionId) {
        if (transactionId == null) {
            throw new BadRequestException("Transaction ID is required to return a book");
        }

        // 1. Fetch exact transaction by primary key
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + transactionId));

        // 2. Verify that transaction is currently BORROWED
        if (transaction.getStatus() == TransactionStatus.RETURNED) {
            throw new BadRequestException("This transaction has already been returned.");
        }

        // 3. Calculate borrowing period and fine
        LocalDate issueDate = transaction.getIssueDate();
        LocalDate returnDate = LocalDate.now();
        long daysBorrowed = ChronoUnit.DAYS.between(issueDate, returnDate);

        double fine = 0.0;
        if (daysBorrowed > 15) {
            long lateDays = daysBorrowed - 15;
            fine = lateDays * 2.0;
        }

        // 4. Update transaction status, returnDate, fine
        transaction.setReturnDate(returnDate);
        transaction.setStatus(TransactionStatus.RETURNED);
        transaction.setFine(fine);
        Transaction savedTransaction = transactionRepository.save(transaction);

        // 5. Restore book stock (ensure availableCopies does not exceed totalCopies)
        Book book = transaction.getBook();
        int newAvailable = Math.min(book.getTotalCopies(), book.getAvailableCopies() + 1);
        book.setAvailableCopies(newAvailable);
        bookRepository.save(book);

        // 6. Build response details matching specification
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", fine > 0 ? "Book returned successfully. Late fine: ₹" + String.format("%.2f", fine) : "Book returned successfully");
        response.put("transactionId", savedTransaction.getId());
        response.put("book", book.getTitle());
        response.put("studentUsn", transaction.getStudent().getUsn());
        response.put("studentName", transaction.getStudent().getName());
        response.put("issueDate", issueDate.toString());
        response.put("returnDate", returnDate.toString());
        response.put("daysBorrowed", daysBorrowed);
        response.put("fine", fine);
        response.put("transaction", savedTransaction);

        return response;
    }

    /**
     * Fallback Return Method: Handles return requests by transactionId, or gracefully resolves USN + bookId/title
     */
    @Transactional
    public Map<String, Object> returnBook(ReturnRequest request) {
        if (request.getTransactionId() != null) {
            return returnBookByTransactionId(request.getTransactionId());
        }

        if (request.getUsn() == null || request.getUsn().trim().isEmpty()) {
            throw new BadRequestException("Student USN or Transaction ID is required for returning a book");
        }

        String usn = request.getUsn().trim().toUpperCase();

        // Find active transactions using List to prevent NonUniqueResultException
        List<Transaction> activeTransactions;

        if (request.getBookId() != null) {
            activeTransactions = transactionRepository.findByStudentUsnIgnoreCaseAndBookIdAndStatus(
                    usn, request.getBookId(), TransactionStatus.BORROWED);
        } else if (request.getBookTitle() != null && !request.getBookTitle().trim().isEmpty()) {
            activeTransactions = transactionRepository.findByStudentUsnIgnoreCaseAndBookTitleIgnoreCaseAndStatus(
                    usn, request.getBookTitle().trim(), TransactionStatus.BORROWED);
        } else {
            throw new BadRequestException("Book ID, Book Title, or Transaction ID must be provided to return a book");
        }

        if (activeTransactions.isEmpty()) {
            throw new BadRequestException("No active borrowed record found for student USN '" + usn + "' and the specified book.");
        }

        if (activeTransactions.size() > 1) {
            logger.warn("DUPLICATE ACTIVE TRANSACTIONS DETECTED: Found {} active borrow records for USN '{}'. Processing latest record #{}",
                    activeTransactions.size(), usn, activeTransactions.get(0).getId());
        }

        // Process return for the selected active transaction using transaction ID
        Transaction target = activeTransactions.get(0);
        return returnBookByTransactionId(target.getId());
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByIssueDateDescIdDesc();
    }

    public List<Transaction> getTransactionsByStudent(String usn) {
        if (usn == null || usn.trim().isEmpty()) {
            throw new BadRequestException("USN cannot be empty");
        }
        return transactionRepository.findByStudentUsnIgnoreCaseOrderByIssueDateDescIdDesc(usn.trim());
    }

    public List<Transaction> filterTransactions(String usn, String statusStr, String search) {
        TransactionStatus status = null;
        if (statusStr != null && !statusStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusStr.trim())) {
            try {
                status = TransactionStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid status enum
            }
        }

        String cleanedUsn = (usn != null && !usn.trim().isEmpty()) ? usn.trim() : null;
        String cleanedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return transactionRepository.filterTransactions(cleanedUsn, status, cleanedSearch);
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        stats.setTotalBooks(bookRepository.count());
        Integer totalAvailable = bookRepository.sumAvailableCopies();
        stats.setTotalAvailableCopies(totalAvailable != null ? totalAvailable : 0);
        stats.setTotalStudents(studentRepository.count());

        stats.setCurrentlyBorrowedBooks(transactionRepository.countByStatus(TransactionStatus.BORROWED));
        stats.setReturnedBooks(transactionRepository.countByStatus(TransactionStatus.RETURNED));

        List<Transaction> activeTransactions = transactionRepository.findByStatusOrderByIssueDateDescIdDesc(TransactionStatus.BORROWED);
        long overdueCount = activeTransactions.stream()
                .filter(t -> ChronoUnit.DAYS.between(t.getIssueDate(), LocalDate.now()) > 15)
                .count();
        stats.setPendingReturns(overdueCount);

        Double finesSum = transactionRepository.sumTotalFines();
        stats.setTotalFinesCollected(finesSum != null ? finesSum : 0.0);

        List<Transaction> allRecent = transactionRepository.findAllByOrderByIssueDateDescIdDesc();
        stats.setRecentTransactions(allRecent.stream().limit(10).toList());

        return stats;
    }

    public Transaction getTransactionById(Long id) {
        if (id == null) {
            throw new BadRequestException("Transaction ID cannot be null");
        }
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));
    }

    public Map<String, Object> getPenaltiesReport() {
        Double finesSum = transactionRepository.sumTotalFines();
        double totalCollected = finesSum != null ? finesSum : 0.0;

        List<Transaction> penaltyTransactions = transactionRepository.findCollectedPenalties();
        int penaltyCount = penaltyTransactions.size();

        // Calculate active accruing fines
        List<Transaction> activeTransactions = transactionRepository.findByStatusOrderByIssueDateDescIdDesc(TransactionStatus.BORROWED);
        LocalDate today = LocalDate.now();
        double activeAccruingFines = 0.0;
        long overdueCount = 0;

        for (Transaction t : activeTransactions) {
            long days = ChronoUnit.DAYS.between(t.getIssueDate(), today);
            if (days > 15) {
                overdueCount++;
                activeAccruingFines += (days - 15) * 2.0;
            }
        }

        // Format collected penalties list
        List<Map<String, Object>> collectedList = new ArrayList<>();
        Map<String, Map<String, Object>> studentAggregates = new LinkedHashMap<>();

        for (Transaction t : penaltyTransactions) {
            long days = ChronoUnit.DAYS.between(t.getIssueDate(), t.getReturnDate() != null ? t.getReturnDate() : today);
            long daysOverdue = Math.max(0, days - 15);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("transactionId", t.getId());
            item.put("studentId", t.getStudent().getId());
            item.put("studentName", t.getStudent().getName());
            item.put("studentUsn", t.getStudent().getUsn());
            item.put("studentContact", t.getStudent().getContact());
            item.put("bookId", t.getBook().getId());
            item.put("bookTitle", t.getBook().getTitle());
            item.put("bookAuthor", t.getBook().getAuthor());
            item.put("bookCategory", t.getBook().getCategory());
            item.put("issueDate", t.getIssueDate().toString());
            item.put("returnDate", t.getReturnDate() != null ? t.getReturnDate().toString() : "-");
            item.put("daysBorrowed", days);
            item.put("daysOverdue", daysOverdue);
            item.put("fine", t.getFine());
            collectedList.add(item);

            // Group by student USN
            String usnKey = t.getStudent().getUsn();
            Map<String, Object> studentAgg = studentAggregates.computeIfAbsent(usnKey, k -> {
                Map<String, Object> s = new LinkedHashMap<>();
                s.put("usn", t.getStudent().getUsn());
                s.put("name", t.getStudent().getName());
                s.put("contact", t.getStudent().getContact());
                s.put("totalFine", 0.0);
                s.put("penaltyCount", 0);
                return s;
            });
            studentAgg.put("totalFine", (Double) studentAgg.get("totalFine") + (t.getFine() != null ? t.getFine() : 0.0));
            studentAgg.put("penaltyCount", (Integer) studentAgg.get("penaltyCount") + 1);
        }

        List<Map<String, Object>> studentSummaryList = new ArrayList<>(studentAggregates.values());
        studentSummaryList.sort((a, b) -> Double.compare((Double) b.get("totalFine"), (Double) a.get("totalFine")));

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalCollectedFines", totalCollected);
        report.put("totalFineTransactionsCount", penaltyCount);
        report.put("activeAccruingFines", activeAccruingFines);
        report.put("overdueTransactionsCount", overdueCount);
        report.put("collectedPenalties", collectedList);
        report.put("studentSummary", studentSummaryList);

        return report;
    }
}
