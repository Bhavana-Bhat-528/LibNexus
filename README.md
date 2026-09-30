# 📚 College Library Management System (Spring Boot + JPA + REST + Bootstrap 5)

A professional, full-stack Library Management Web Application built with **Spring Boot 3**, **Spring Data JPA**, **MySQL**, **Maven**, and a modern **Bootstrap 5 SPA frontend**. Refactored from legacy Servlet/JDBC architecture into a enterprise-grade clean layered architecture.

---

## 🚀 Features

- **Dashboard Portal**: Real-time stats (Total Books, Available Copies, Total Students, Currently Borrowed, Returned, Overdue Returns >15 days, Total Fines Collected, Recent Activity).
- **Book Inventory Management**: Complete CRUD operations for library books with categories and stock level tracking (`AVAILABLE`, `LOW_STOCK`, `OUT_OF_STOCK`). Initial 9 book titles auto-seeded on startup.
- **Student Directory**: Student management with unique USN validation and active borrow limit tracking.
- **Book Borrowing System**:
  - Issue 1 to 3 books in a single request.
  - Strictly enforces **maximum 3 active borrowed books per student**.
  - Automatically checks stock availability and updates inventory.
- **Book Return & Fine System**:
  - Process book returns with real-time fine calculation.
  - Allowed period: **15 days**.
  - Late fine formula: $\text{Late days} \times ₹2$.
  - Preserves historical return data without deleting transaction records.
- **My Books / Student History**: View student profile, current active borrowed books, and complete past return history with fine badges.
- **Transaction History**: Comprehensive, filterable table supporting search, USN filter, and status filter (`BORROWED` / `RETURNED`).

---

## 🛠️ Technology Stack

- **Backend**: Java 17+, Spring Boot 3.3.3, Spring Data JPA, Hibernate, Maven, MySQL Connector/J
- **Frontend**: HTML5, CSS3, JavaScript (ES6 Fetch API), Bootstrap 5.3.3, Bootstrap Icons
- **Database**: MySQL 8.x

---

## 🏗️ Project Architecture

```
src/main/java/com/librarymanagement/
├── LibraryManagementApplication.java
├── config/
│   └── DataInitializer.java
├── controller/
│   ├── BookController.java
│   ├── StudentController.java
│   ├── TransactionController.java
│   └── DashboardController.java
├── dto/
│   ├── ApiResponse.java
│   ├── BorrowRequest.java
│   ├── ReturnRequest.java
│   ├── DashboardStatsDto.java
│   └── StudentDto.java
├── entity/
│   ├── Book.java
│   ├── Student.java
│   ├── Transaction.java
│   └── TransactionStatus.java
├── exception/
│   ├── ResourceNotFoundException.java
│   ├── BadRequestException.java
│   └── GlobalExceptionHandler.java
├── repository/
│   ├── BookRepository.java
│   ├── StudentRepository.java
│   └── TransactionRepository.java
└── service/
    ├── BookService.java
    ├── StudentService.java
    └── TransactionService.java

src/main/resources/
├── application.properties
└── static/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── app.js
        ├── books.js
        ├── students.js
        └── transactions.js
```

---

## 🗄️ Database Configuration & Schema

### `application.properties`
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/LibraryDB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
```

### Table Relationships
- `Student` (1) ───< (Many) `Transaction`
- `Book` (1) ───< (Many) `Transaction`

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Retrieve aggregate metrics and recent activity |
| `GET` | `/api/books` | Get all books (supports `?search=` and `?category=`) |
| `GET` | `/api/books/{id}` | Get book details by ID |
| `GET` | `/api/books/search?title=...` | Search books by partial title |
| `GET` | `/api/books/{id}/availability` | Get book stock & availability status |
| `POST` | `/api/books` | Add a new book |
| `PUT` | `/api/books/{id}` | Update existing book |
| `DELETE` | `/api/books/{id}` | Delete book |
| `GET` | `/api/students` | Get all students (supports `?search=`) |
| `GET` | `/api/students/usn/{usn}` | Get student by USN |
| `POST` | `/api/students` | Register student |
| `PUT` | `/api/students/{id}` | Update student details |
| `DELETE` | `/api/students/{id}` | Delete student |
| `POST` | `/api/transactions/borrow` | Issue books to student |
| `POST` | `/api/transactions/return` | Return book and calculate fine |
| `GET` | `/api/transactions` | Query all transaction history with filters |
| `GET` | `/api/transactions/student/{usn}` | Get student borrow & return history |

---

## ⚙️ How to Setup and Run

### Prerequisites
- JDK 17 or higher
- Maven 3.8+
- MySQL Server 8.0+

### Steps
1. **Start MySQL Server** and ensure a database named `LibraryDB` exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS LibraryDB;
   ```
2. **Configure Database Credentials**:
   Edit `src/main/resources/application.properties` with your MySQL username and password if different from default `root` / empty password.
3. **Build & Run Application**:
   ```bash
   mvn clean spring-boot:run
   ```
4. **Access Web Application**:
   Open browser and navigate to:
   [http://localhost:8080/](http://localhost:8080/)
