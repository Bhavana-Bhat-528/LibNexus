package com.librarymanagement.repository;

import com.librarymanagement.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByTitleIgnoreCase(String title);

    List<Book> findByTitleContainingIgnoreCase(String title);

    List<Book> findByCategoryIgnoreCase(String category);

    boolean existsByTitleIgnoreCase(String title);

    @Query("SELECT DISTINCT b.category FROM Book b ORDER BY b.category ASC")
    List<String> findAllCategories();

    @Query("SELECT SUM(b.availableCopies) FROM Book b")
    Integer sumAvailableCopies();

    @Query("SELECT SUM(b.totalCopies) FROM Book b")
    Integer sumTotalCopies();
}
