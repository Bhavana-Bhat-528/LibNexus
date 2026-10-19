package com.librarymanagement.config;

import com.librarymanagement.entity.*;
import com.librarymanagement.repository.BookRepository;
import com.librarymanagement.repository.StudentRepository;
import com.librarymanagement.repository.TransactionRepository;
import com.librarymanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(BookRepository bookRepository,
                           StudentRepository studentRepository,
                           TransactionRepository transactionRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeBooks();
        initializeSampleStudentsAndTransactions();
        initializeUsers();
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

            // Create sample initial transactions for demonstration
            Book b1 = bookRepository.findByTitleIgnoreCase("Java Programming").orElse(null);
            Book b2 = bookRepository.findByTitleIgnoreCase("Data Structures").orElse(null);
            Book b3 = bookRepository.findByTitleIgnoreCase("Web Development").orElse(null);

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

            // Create a sample returned transaction with collected late fine (7 days overdue = ₹14.00)
            if (b3 != null) {
                Transaction t3 = new Transaction(s1, b3, LocalDate.now().minusDays(25), TransactionStatus.RETURNED);
                t3.setReturnDate(LocalDate.now().minusDays(3));
                t3.setFine(14.0);
                transactionRepository.save(t3);
            }
        }
    }

    private void initializeUsers() {
        // 1. Seed Librarian Account if not present
        if (!userRepository.existsByUsernameIgnoreCase("librarian")) {
            User librarian = new User(
                    "librarian",
                    passwordEncoder.encode("librarian123"),
                    Role.ROLE_LIBRARIAN
            );
            userRepository.save(librarian);
            System.out.println(">>> LIBRARIAN ACCOUNT CREATED: 'librarian' / 'librarian123' <<<");
        }

        // 2. Ensure every student has an associated user account
        List<Student> students = studentRepository.findAll();
        for (Student s : students) {
            if (s.getUsn() != null && userRepository.findByStudentUsnIgnoreCase(s.getUsn()).isEmpty()) {
                String candidateUsername;
                if (s.getName() != null && !s.getName().trim().isEmpty()) {
                    candidateUsername = s.getName().trim().split("\\s+")[0].toLowerCase();
                } else {
                    candidateUsername = s.getUsn().trim().toLowerCase();
                }
                if (userRepository.existsByUsernameIgnoreCase(candidateUsername)) {
                    candidateUsername = s.getUsn().trim().toLowerCase();
                }
                if (userRepository.existsByUsernameIgnoreCase(candidateUsername)) {
                    candidateUsername = s.getUsn().trim().toLowerCase() + "_" + (s.getId() != null ? s.getId() : System.currentTimeMillis());
                }
                User studentUser = new User(candidateUsername, passwordEncoder.encode("student123"), Role.ROLE_STUDENT, s);
                userRepository.save(studentUser);
                System.out.println(">>> SEEDED STUDENT USER: " + candidateUsername + " (USN: " + s.getUsn() + ") <<<");
            }
        }
    }
}
