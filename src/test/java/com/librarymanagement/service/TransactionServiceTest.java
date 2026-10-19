package com.librarymanagement.service;

import com.librarymanagement.dto.BorrowRequest;
import com.librarymanagement.entity.Book;
import com.librarymanagement.entity.Student;
import com.librarymanagement.entity.Transaction;
import com.librarymanagement.entity.TransactionStatus;
import com.librarymanagement.exception.BadRequestException;
import com.librarymanagement.exception.ResourceNotFoundException;
import com.librarymanagement.repository.BookRepository;
import com.librarymanagement.repository.StudentRepository;
import com.librarymanagement.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private TransactionService transactionService;

    private Student testStudent;
    private Book testBook;

    @BeforeEach
    void setUp() {
        testStudent = new Student("Rahul Sharma", "1MS21CS001", "+91 9876543210");
        testStudent.setId(1L);

        testBook = new Book("Java Programming", "James Gosling", "Computer Science", 5, 5);
        testBook.setId(10L);
    }

    @Test
    @DisplayName("Should successfully borrow a book when student is eligible and book is in stock")
    void testSuccessfulBorrow() {
        BorrowRequest request = new BorrowRequest("1MS21CS001", List.of(10L));

        when(studentRepository.findByUsnIgnoreCase("1MS21CS001")).thenReturn(Optional.of(testStudent));
        when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
        when(transactionRepository.existsByStudentUsnIgnoreCaseAndBookIdAndStatus("1MS21CS001", 10L, TransactionStatus.BORROWED))
                .thenReturn(false);
        when(transactionRepository.countByStudentUsnIgnoreCaseAndStatus("1MS21CS001", TransactionStatus.BORROWED))
                .thenReturn(1);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Transaction> result = transactionService.borrowBooks(request);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testStudent, result.get(0).getStudent());
        assertEquals(testBook, result.get(0).getBook());
        assertEquals(TransactionStatus.BORROWED, result.get(0).getStatus());
        assertEquals(4, testBook.getAvailableCopies(), "Available copies should decrement by 1");

        verify(bookRepository, times(1)).save(testBook);
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should reject borrow request when book is out of stock")
    void testOutOfStockRejection() {
        testBook.setAvailableCopies(0);
        BorrowRequest request = new BorrowRequest("1MS21CS001", List.of(10L));

        when(studentRepository.findByUsnIgnoreCase("1MS21CS001")).thenReturn(Optional.of(testStudent));
        when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
        when(transactionRepository.existsByStudentUsnIgnoreCaseAndBookIdAndStatus("1MS21CS001", 10L, TransactionStatus.BORROWED))
                .thenReturn(false);
        when(transactionRepository.countByStudentUsnIgnoreCaseAndStatus("1MS21CS001", TransactionStatus.BORROWED))
                .thenReturn(0);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> transactionService.borrowBooks(request));
        assertTrue(ex.getMessage().contains("out of stock"));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should enforce maximum 3-book limit strictly")
    void testMaximumThreeBookLimitRejection() {
        BorrowRequest request = new BorrowRequest("1MS21CS001", List.of(10L));

        when(studentRepository.findByUsnIgnoreCase("1MS21CS001")).thenReturn(Optional.of(testStudent));
        when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
        when(transactionRepository.existsByStudentUsnIgnoreCaseAndBookIdAndStatus("1MS21CS001", 10L, TransactionStatus.BORROWED))
                .thenReturn(false);
        // Student already holds 3 books
        when(transactionRepository.countByStudentUsnIgnoreCaseAndStatus("1MS21CS001", TransactionStatus.BORROWED))
                .thenReturn(3);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> transactionService.borrowBooks(request));
        assertTrue(ex.getMessage().contains("Limit exceeded") || ex.getMessage().contains("exceed the maximum allowed limit of 3"));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should reject borrowing duplicate active copy of the same book")
    void testDuplicateActiveLoanRejection() {
        BorrowRequest request = new BorrowRequest("1MS21CS001", List.of(10L));

        when(studentRepository.findByUsnIgnoreCase("1MS21CS001")).thenReturn(Optional.of(testStudent));
        when(bookRepository.findById(10L)).thenReturn(Optional.of(testBook));
        // Already borrowed copy is active
        when(transactionRepository.existsByStudentUsnIgnoreCaseAndBookIdAndStatus("1MS21CS001", 10L, TransactionStatus.BORROWED))
                .thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> transactionService.borrowBooks(request));
        assertTrue(ex.getMessage().contains("already borrowed the book"));
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should return book with zero fine if returned within 15-day period")
    void testSuccessfulReturn_OnTime() {
        Transaction activeTx = new Transaction(testStudent, testBook, LocalDate.now().minusDays(10), TransactionStatus.BORROWED);
        activeTx.setId(50L);
        testBook.setAvailableCopies(4);

        when(transactionRepository.findById(50L)).thenReturn(Optional.of(activeTx));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = transactionService.returnBookByTransactionId(50L);

        assertTrue((Boolean) result.get("success"));
        assertEquals(TransactionStatus.RETURNED, activeTx.getStatus());
        assertEquals(0.0, (Double) result.get("fine"));
        assertEquals(5, testBook.getAvailableCopies(), "Available copies should be restored to 5");
        verify(bookRepository, times(1)).save(testBook);
    }

    @Test
    @DisplayName("Should calculate fine of ₹2.00 per day when returned after 15 days")
    void testSuccessfulReturn_OverdueWithFine() {
        // Borrowed 20 days ago (5 days overdue) -> Fine: 5 * 2.0 = 10.0
        Transaction overdueTx = new Transaction(testStudent, testBook, LocalDate.now().minusDays(20), TransactionStatus.BORROWED);
        overdueTx.setId(51L);
        testBook.setAvailableCopies(2);

        when(transactionRepository.findById(51L)).thenReturn(Optional.of(overdueTx));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = transactionService.returnBookByTransactionId(51L);

        assertTrue((Boolean) result.get("success"));
        assertEquals(TransactionStatus.RETURNED, overdueTx.getStatus());
        assertEquals(10.0, (Double) result.get("fine"), "Fine should be 5 days * 2.0 = 10.0");
        assertEquals(3, testBook.getAvailableCopies());
        verify(bookRepository, times(1)).save(testBook);
    }
}
