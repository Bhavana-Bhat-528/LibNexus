# Library Management System

![Java](https://img.shields.io/badge/Java-17+-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.3-6DB33F?style=flat-square&logo=spring-boot&logoColor=white)
![Spring Data JPA](https://img.shields.io/badge/Spring_Data_JPA-Hibernate-59666C?style=flat-square&logo=hibernate&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Apache Maven](https://img.shields.io/badge/Apache_Maven-3.8+-C71A36?style=flat-square&logo=apache-maven&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.3-7952B3?style=flat-square&logo=bootstrap&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)

A full-stack Library Management System built with Spring Boot, Spring Data JPA, MySQL, and a responsive Bootstrap single-page interface. The application handles catalog inventory, student records, book borrowing and return workflows, automated late fine calculations, and circulation reporting.

---

## Key Features

- **Dashboard & Analytics**: Real-time summary of total books, available inventory, registered students, active loans, returned records, overdue loans, and total collected fines.
- **Book Catalog Management**: Full CRUD operations for books with category categorization, total stock tracking, and automated stock status (`AVAILABLE`, `LOW_STOCK`, `OUT_OF_STOCK`).
- **Student Directory**: Student registration with unique University Seat Number (USN) validation, contact management, and active borrow count tracking.
- **Book Circulation (Issue / Return)**:
  - Multi-book issue support (up to 3 books per request).
  - Validation to ensure students cannot borrow duplicate copies of an unreturned book.
  - Return processing by Transaction ID, student USN, or book title/ID.
- **Automated Fine Calculation**:
  - Standard loan period: 15 days.
  - Overdue fine rate: ₹2.00 per day past the due date.
- **Circulation History & Auditing**:
  - Filterable transaction logs by USN, status (`BORROWED` or `RETURNED`), and search queries.
  - Dedicated student history view showing current loans and past returns with fine records.

---

## Business Rules

1. **Borrowing Limit**: A student can hold a maximum of 3 actively borrowed books at any given time.
2. **Duplicate Prevention**: A student cannot borrow a second copy of a book they currently have checked out.
3. **Inventory Validation**: Books can only be issued if `availableCopies > 0`. Stock counts are atomically updated on issue and return.
4. **Loan Duration & Fines**:
   - Issue duration: 15 days.
   - For returns beyond 15 days: $\text{Fine} = (\text{Days Borrowed} - 15) \times 2.00$.

---

## Technology Stack

### Backend & Database
![Java](https://img.shields.io/badge/Java-17+-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.3-6DB33F?style=flat-square&logo=spring-boot&logoColor=white)
![Spring Data JPA](https://img.shields.io/badge/Spring_Data_JPA-Hibernate-59666C?style=flat-square&logo=hibernate&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Apache Maven](https://img.shields.io/badge/Apache_Maven-3.8+-C71A36?style=flat-square&logo=apache-maven&logoColor=white)

- **Language**: Java 17+
- **Framework**: Spring Boot 3.3.3 (Spring MVC, Spring Data JPA)
- **ORM / Persistence**: Hibernate, Spring Data JPA
- **Database**: MySQL 8.0+
- **Build Tool**: Apache Maven

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.3-7952B3?style=flat-square&logo=bootstrap&logoColor=white)

- **Structure & Styling**: HTML5, CSS3, Bootstrap 5.3.3, Bootstrap Icons
- **Client Logic**: Vanilla JavaScript (ES6 Fetch API)

---

## Project Structure

```text
Library-Management-System/
├── src/
│   ├── main/
│   │   ├── java/com/librarymanagement/
│   │   │   ├── LibraryManagementApplication.java
│   │   │   ├── config/
│   │   │   │   └── DataInitializer.java
│   │   │   ├── controller/
│   │   │   │   ├── BookController.java
│   │   │   │   ├── DashboardController.java
│   │   │   │   ├── StudentController.java
│   │   │   │   └── TransactionController.java
│   │   │   ├── dto/
│   │   │   │   ├── ApiResponse.java
│   │   │   │   ├── BorrowRequest.java
│   │   │   │   ├── DashboardStatsDto.java
│   │   │   │   ├── ReturnRequest.java
│   │   │   │   └── StudentDto.java
│   │   │   ├── entity/
│   │   │   │   ├── Book.java
│   │   │   │   ├── Student.java
│   │   │   │   ├── Transaction.java
│   │   │   │   └── TransactionStatus.java
│   │   │   ├── exception/
│   │   │   │   ├── BadRequestException.java
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── ResourceNotFoundException.java
│   │   │   ├── repository/
│   │   │   │   ├── BookRepository.java
│   │   │   │   ├── StudentRepository.java
│   │   │   │   └── TransactionRepository.java
│   │   │   └── service/
│   │   │       ├── BookService.java
│   │   │       ├── StudentService.java
│   │   │       └── TransactionService.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/
│   │           ├── index.html
│   │           ├── css/
│   │           │   └── style.css
│   │           └── js/
│   │               ├── app.js
│   │               ├── books.js
│   │               ├── students.js
│   │               └── transactions.js
└── pom.xml
```

---

## Database Configuration

The application uses Spring Data JPA with MySQL. Configure database connection properties in `src/main/resources/application.properties`:

```properties
server.port=8080

spring.datasource.url=jdbc:mysql://localhost:3306/LibraryDB?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

### Entity Relationships

- **Student** (1) ───< (Many) **Transaction**
- **Book** (1) ───< (Many) **Transaction**

---

## REST API Specification

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Retrieve aggregate metrics, counts, and recent transactions |

### Books

| Method | Endpoint | Description | Query / Body Parameters |
|---|---|---|---|
| `GET` | `/api/books` | List all books | `search` (optional), `category` (optional) |
| `GET` | `/api/books/{id}` | Get book details by ID | — |
| `GET` | `/api/books/search` | Search books by title | `title` (required) |
| `GET` | `/api/books/{id}/availability` | Check book availability status | — |
| `POST` | `/api/books` | Create a new book | JSON object (`title`, `author`, `category`, `totalCopies`) |
| `PUT` | `/api/books/{id}` | Update existing book details | JSON object (`title`, `author`, `category`, `totalCopies`, `availableCopies`) |
| `DELETE` | `/api/books/{id}` | Remove book from inventory | — |

### Students

| Method | Endpoint | Description | Query / Body Parameters |
|---|---|---|---|
| `GET` | `/api/students` | List all students | `search` (optional) |
| `GET` | `/api/students/{id}` | Get student details by ID | — |
| `GET` | `/api/students/usn/{usn}` | Get student by USN | — |
| `POST` | `/api/students` | Register a new student | JSON object (`name`, `usn`, `contact`) |
| `PUT` | `/api/students/{id}` | Update student details | JSON object (`name`, `usn`, `contact`) |
| `DELETE` | `/api/students/{id}` | Delete student record | — |

### Transactions

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `POST` | `/api/transactions/borrow` | Issue one or more books | `{"usn": "...", "bookIds": [1, 2]}` or `{"usn": "...", "bookTitles": ["..."]}` |
| `POST` | `/api/transactions/return` | Return an issued book | `{"transactionId": 1}` or `{"usn": "...", "bookId": 1}` |
| `GET` | `/api/transactions` | Query transactions with filters | `usn`, `status` (`BORROWED`/`RETURNED`), `search` (all optional) |
| `GET` | `/api/transactions/student/{usn}` | Retrieve transaction history for a specific USN | — |

---

## Setup and Installation

### Prerequisites

- **Java Development Kit (JDK)**: Version 17 or higher
- **Apache Maven**: Version 3.8 or higher
- **MySQL Server**: Version 8.0 or higher

### Installation Steps

1. **Clone or Navigate to the Repository**:
   ```bash
   git clone <repository-url>
   cd Library-Management-System
   ```

2. **Create MySQL Database**:
   Log in to MySQL and create the database schema:
   ```sql
   CREATE DATABASE IF NOT EXISTS LibraryDB;
   ```

3. **Update Application Properties**:
   Open `src/main/resources/application.properties` and set your MySQL credentials:
   ```properties
   spring.datasource.username=your_mysql_user
   spring.datasource.password=your_mysql_password
   ```

4. **Build and Run the Application**:
   Using Maven wrapper or standard Maven:
   ```bash
   mvn clean spring-boot:run
   ```

5. **Access the Application**:
   Once the server starts, open your web browser and go to:
   ```text
   http://localhost:8080/
   ```

---

## Sample Data

On initial startup, `DataInitializer` automatically seeds:
- 9 catalog books across multiple subjects (Computer Science, Programming, Artificial Intelligence, Networking, Database Systems).
- 3 sample student records with mock borrowing transactions to demonstrate active borrowed books and overdue fine calculations.

## Note:
This project is still being developed