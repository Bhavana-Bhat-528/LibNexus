package com.librarymanagement.service;

import com.librarymanagement.entity.Book;
import com.librarymanagement.exception.BadRequestException;
import com.librarymanagement.exception.ResourceNotFoundException;
import com.librarymanagement.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private BookService bookService;

    private Book testBook;

    @BeforeEach
    void setUp() {
        testBook = new Book("Operating Systems", "Abraham Silberschatz", "Computer Science", 4, 4);
        testBook.setId(1L);
    }

    @Test
    @DisplayName("Should successfully add a new book")
    void testAddBook_Success() {
        when(bookRepository.existsByTitleIgnoreCase("Operating Systems")).thenReturn(false);
        when(bookRepository.save(any(Book.class))).thenReturn(testBook);

        Book saved = bookService.addBook(testBook);
        assertNotNull(saved);
        assertEquals("Operating Systems", saved.getTitle());
        verify(bookRepository, times(1)).save(testBook);
    }

    @Test
    @DisplayName("Should reject adding book with duplicate title")
    void testAddBook_DuplicateTitle() {
        when(bookRepository.existsByTitleIgnoreCase("Operating Systems")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> bookService.addBook(testBook));
        assertTrue(ex.getMessage().contains("already exists"));
        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    @DisplayName("Should successfully update book details")
    void testUpdateBook_Success() {
        Book updatedInfo = new Book("Operating Systems Concepts", "A. Silberschatz", "Computer Science", 6, 6);

        when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));
        when(bookRepository.existsByTitleIgnoreCase("Operating Systems Concepts")).thenReturn(false);
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Book result = bookService.updateBook(1L, updatedInfo);
        assertEquals("Operating Systems Concepts", result.getTitle());
        assertEquals("A. Silberschatz", result.getAuthor());
        assertEquals(6, result.getTotalCopies());
    }

    @Test
    @DisplayName("Should delete book by ID")
    void testDeleteBook_Success() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));

        bookService.deleteBook(1L);
        verify(bookRepository, times(1)).delete(testBook);
    }

    @Test
    @DisplayName("Should return availability details correctly")
    void testCheckAvailability() {
        when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));

        Map<String, Object> availability = bookService.checkAvailability(1L);
        assertNotNull(availability);
        assertEquals(1L, availability.get("id"));
        assertEquals("Operating Systems", availability.get("title"));
        assertEquals(4, availability.get("availableCopies"));
        assertEquals(true, availability.get("isAvailable"));
        assertEquals("AVAILABLE", availability.get("status"));
    }
}
