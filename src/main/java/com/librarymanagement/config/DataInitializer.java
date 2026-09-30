package com.librarymanagement.config;

import com.librarymanagement.entity.Book;
import com.librarymanagement.entity.Student;
import com.librarymanagement.entity.Transaction;
import com.librarymanagement.entity.TransactionStatus;
import com.librarymanagement.repository.BookRepository;
import com.librarymanagement.repository.StudentRepository;
import com.librarymanagement.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public DataInitializer(BookRepository bookRepository,
                           StudentRepository studentRepository,
                           TransactionRepository transactionRepository) {
        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeBooks();
        initializeSampleStudentsAndTransactions();
    }

    private void initializeBooks() {
        if (bookRepository.count() == 0) {
            List<Book> initialBooks = List.of(
                    new Book("Java Programming", "James Gosling", "Computer Science", 5, 5),
                    new Book("Data Structures", "Mark Allen Weiss", "Computer Science", 3, 3),
                    new Book("Web Development", "Jon Duckett", "Web Technologies", 2, 2),
                    new Book("Operating Systems", "Abraham Silberschatz", "Computer Science", 4, 4),
                    new Book("Python Programming", "Guido van Rossum", "Programming", 3, 3),
                    new Book("Database Management", "Raghu Ramakrishnan", "Database Systems", 2, 2),
                    new Book("AI/ML", "Stuart Russell", "Artificial Intelligence", 20, 20),
                    new Book("OOPS in C++", "E. Balagurusamy", "Programming", 6, 6),
                    new Book("Computer Networks", "Andrew S. Tanenbaum", "Networking", 7, 7)
            );
            bookRepository.saveAll(initialBooks);
            System.out.println(">>> INITIAL BOOK INVENTORY POPULATED SUCCESSFULLY (" + initialBooks.size() + " books) <<<");
        }
    }

    private void initializeSampleStudentsAndTransactions() {
        if (studentRepository.count() == 0) {
            Student s1 = new Student("Rahul Sharma", "1MS21CS001", "+91 9876543210");
            Student s2 = new Student("Ananya Rao", "1MS21CS002", "+91 9876543211");
            Student s3 = new Student("Vikram Patel", "1MS21CS003", "+91 9876543212");
            studentRepository.saveAll(List.of(s1, s2, s3));

            System.out.println(">>> SAMPLE STUDENTS CREATED <<<");

            // Create a few initial transaction records for demonstration
            Book b1 = bookRepository.findByTitleIgnoreCase("Java Programming").orElse(null);
            Book b2 = bookRepository.findByTitleIgnoreCase("Data Structures").orElse(null);

            if (b1 != null && b1.getAvailableCopies() > 0) {
                b1.setAvailableCopies(b1.getAvailableCopies() - 1);
                bookRepository.save(b1);

                Transaction t1 = new Transaction(s1, b1, LocalDate.now().minusDays(5), TransactionStatus.BORROWED);
                transactionRepository.save(t1);
            }

            if (b2 != null && b2.getAvailableCopies() > 0) {
                b2.setAvailableCopies(b2.getAvailableCopies() - 1);
                bookRepository.save(b2);

                Transaction t2 = new Transaction(s2, b2, LocalDate.now().minusDays(20), TransactionStatus.BORROWED);
                transactionRepository.save(t2);
            }
        }
    }
}
