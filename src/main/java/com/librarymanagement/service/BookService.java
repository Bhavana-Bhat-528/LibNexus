package com.librarymanagement.service;

import com.librarymanagement.entity.Book;
import com.librarymanagement.exception.BadRequestException;
import com.librarymanagement.exception.ResourceNotFoundException;
import com.librarymanagement.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BookService {

    private final BookRepository bookRepository;

    @Autowired
    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with ID: " + id));
    }

    public List<Book> searchBooks(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllBooks();
        }
        return bookRepository.findByTitleContainingIgnoreCase(query.trim());
    }

    public List<Book> filterByCategory(String category) {
        if (category == null || category.trim().isEmpty() || "ALL".equalsIgnoreCase(category.trim())) {
            return getAllBooks();
        }
        return bookRepository.findByCategoryIgnoreCase(category.trim());
    }

    public List<String> getAllCategories() {
        return bookRepository.findAllCategories();
    }

    @Transactional
    public Book addBook(Book book) {
        if (book.getTitle() == null || book.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Book title cannot be empty");
        }
        if (book.getAuthor() == null || book.getAuthor().trim().isEmpty()) {
            throw new BadRequestException("Book author cannot be empty");
        }
        if (book.getCategory() == null || book.getCategory().trim().isEmpty()) {
            throw new BadRequestException("Book category cannot be empty");
        }
        if (book.getTotalCopies() == null || book.getTotalCopies() < 0) {
            throw new BadRequestException("Total copies must be 0 or greater");
        }
        if (book.getAvailableCopies() == null) {
            book.setAvailableCopies(book.getTotalCopies());
        }
        if (book.getAvailableCopies() > book.getTotalCopies()) {
            throw new BadRequestException("Available copies cannot exceed total copies");
        }

        if (bookRepository.existsByTitleIgnoreCase(book.getTitle().trim())) {
            throw new BadRequestException("Book with title '" + book.getTitle().trim() + "' already exists");
        }

        book.setTitle(book.getTitle().trim());
        book.setAuthor(book.getAuthor().trim());
        book.setCategory(book.getCategory().trim());

        return bookRepository.save(book);
    }

    @Transactional
    public Book updateBook(Long id, Book updatedBook) {
        Book existingBook = getBookById(id);

        if (updatedBook.getTitle() != null && !updatedBook.getTitle().trim().isEmpty()) {
            String trimmedTitle = updatedBook.getTitle().trim();
            if (!existingBook.getTitle().equalsIgnoreCase(trimmedTitle) &&
                    bookRepository.existsByTitleIgnoreCase(trimmedTitle)) {
                throw new BadRequestException("Another book with title '" + trimmedTitle + "' already exists");
            }
            existingBook.setTitle(trimmedTitle);
        }

        if (updatedBook.getAuthor() != null && !updatedBook.getAuthor().trim().isEmpty()) {
            existingBook.setAuthor(updatedBook.getAuthor().trim());
        }

        if (updatedBook.getCategory() != null && !updatedBook.getCategory().trim().isEmpty()) {
            existingBook.setCategory(updatedBook.getCategory().trim());
        }

        if (updatedBook.getTotalCopies() != null) {
            if (updatedBook.getTotalCopies() < 0) {
                throw new BadRequestException("Total copies must be 0 or greater");
            }
            int diff = updatedBook.getTotalCopies() - existingBook.getTotalCopies();
            existingBook.setTotalCopies(updatedBook.getTotalCopies());
            existingBook.setAvailableCopies(Math.max(0, existingBook.getAvailableCopies() + diff));
        }

        if (updatedBook.getAvailableCopies() != null) {
            if (updatedBook.getAvailableCopies() < 0 || updatedBook.getAvailableCopies() > existingBook.getTotalCopies()) {
                throw new BadRequestException("Available copies must be between 0 and total copies (" + existingBook.getTotalCopies() + ")");
            }
            existingBook.setAvailableCopies(updatedBook.getAvailableCopies());
        }

        return bookRepository.save(existingBook);
    }

    @Transactional
    public void deleteBook(Long id) {
        Book book = getBookById(id);
        bookRepository.delete(book);
    }

    public Map<String, Object> checkAvailability(Long id) {
        Book book = getBookById(id);
        return buildAvailabilityResponse(book);
    }

    public Map<String, Object> checkAvailabilityByTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new BadRequestException("Please provide a book title to check availability");
        }
        Book book = bookRepository.findByTitleIgnoreCase(title.trim())
                .orElseGet(() -> {
                    List<Book> matches = bookRepository.findByTitleContainingIgnoreCase(title.trim());
                    if (matches.isEmpty()) {
                        throw new ResourceNotFoundException("Book not found in library catalog matching: '" + title + "'");
                    }
                    return matches.get(0);
                });
        return buildAvailabilityResponse(book);
    }

    private Map<String, Object> buildAvailabilityResponse(Book book) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", book.getId());
        response.put("title", book.getTitle());
        response.put("author", book.getAuthor());
        response.put("category", book.getCategory());
        response.put("totalCopies", book.getTotalCopies());
        response.put("availableCopies", book.getAvailableCopies());
        response.put("status", book.getStatus());
        response.put("isAvailable", book.getAvailableCopies() > 0);
        return response;
    }
}
