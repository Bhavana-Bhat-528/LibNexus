package com.librarymanagement.repository;

import com.librarymanagement.entity.Transaction;
import com.librarymanagement.entity.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    int countByStudentUsnIgnoreCaseAndStatus(String usn, TransactionStatus status);

    int countByStatus(TransactionStatus status);

    List<Transaction> findByStudentUsnIgnoreCaseOrderByIssueDateDescIdDesc(String usn);

    // Returning List<Transaction> instead of Optional to safely handle potential duplicate active records
    List<Transaction> findByStudentUsnIgnoreCaseAndBookIdAndStatus(String usn, Long bookId, TransactionStatus status);

    List<Transaction> findByStudentUsnIgnoreCaseAndBookTitleIgnoreCaseAndStatus(String usn, String bookTitle, TransactionStatus status);

    boolean existsByStudentUsnIgnoreCaseAndBookIdAndStatus(String usn, Long bookId, TransactionStatus status);

    boolean existsByStudentUsnIgnoreCaseAndBookTitleIgnoreCaseAndStatus(String usn, String bookTitle, TransactionStatus status);

    List<Transaction> findAllByOrderByIssueDateDescIdDesc();

    List<Transaction> findByStatusOrderByIssueDateDescIdDesc(TransactionStatus status);

    List<Transaction> findByStudentUsnIgnoreCaseAndStatusOrderByIssueDateDescIdDesc(String usn, TransactionStatus status);

    @Query("SELECT SUM(t.fine) FROM Transaction t WHERE t.status = 'RETURNED'")
    Double sumTotalFines();

    @Query("SELECT t FROM Transaction t WHERE " +
           "(:usn IS NULL OR LOWER(t.student.usn) LIKE LOWER(CONCAT('%', :usn, '%'))) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:search IS NULL OR LOWER(t.book.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.student.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Transaction> filterTransactions(
            @Param("usn") String usn,
            @Param("status") TransactionStatus status,
            @Param("search") String search);
}
