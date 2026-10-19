package com.librarymanagement.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.librarymanagement.entity.Book;
import com.librarymanagement.entity.Role;
import com.librarymanagement.entity.Student;
import com.librarymanagement.entity.User;
import com.librarymanagement.service.BookService;
import com.librarymanagement.service.StudentService;
import com.librarymanagement.service.TransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookService bookService;

    @MockBean
    private StudentService studentService;

    @MockBean
    private TransactionService transactionService;

    @Test
    @DisplayName("STUDENT role must be rejected with 403 Forbidden when calling POST /api/books")
    @WithMockUser(username = "rahul", roles = {"STUDENT"})
    void testStudentCannotAddBook() throws Exception {
        Book newBook = new Book("Hacking 101", "Anonymous", "Security", 2, 2);

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newBook)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("STUDENT role must be rejected with 403 Forbidden when calling DELETE /api/books/{id}")
    @WithMockUser(username = "rahul", roles = {"STUDENT"})
    void testStudentCannotDeleteBook() throws Exception {
        mockMvc.perform(delete("/api/books/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("STUDENT role must be rejected with 403 Forbidden when calling GET /api/students")
    @WithMockUser(username = "rahul", roles = {"STUDENT"})
    void testStudentCannotListAllStudents() throws Exception {
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("LIBRARIAN role can successfully call POST /api/books")
    @WithMockUser(username = "librarian", roles = {"LIBRARIAN"})
    void testLibrarianCanAddBook() throws Exception {
        Book newBook = new Book("Algorithms", "Robert Sedgewick", "Computer Science", 3, 3);
        when(bookService.addBook(any(Book.class))).thenReturn(newBook);

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newBook)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("STUDENT cannot view another student's transactions")
    void testStudentCannotAccessAnotherStudentTransactions() throws Exception {
        Student s1 = new Student("Rahul Sharma", "1MS21CS001", "+91 9876543210");
        s1.setId(1L);

        User studentUser = new User("rahul", "encodedPass", Role.ROLE_STUDENT, s1);
        studentUser.setId(10L);
        UserDetailsImpl userDetails = UserDetailsImpl.build(studentUser);

        // Rahul tries to access Ananya's records (1MS21CS002)
        mockMvc.perform(get("/api/transactions/student/1MS21CS002")
                        .with(user(userDetails)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("STUDENT can view their own transactions successfully")
    void testStudentCanAccessOwnTransactions() throws Exception {
        Student s1 = new Student("Rahul Sharma", "1MS21CS001", "+91 9876543210");
        s1.setId(1L);

        User studentUser = new User("rahul", "encodedPass", Role.ROLE_STUDENT, s1);
        studentUser.setId(10L);
        UserDetailsImpl userDetails = UserDetailsImpl.build(studentUser);

        mockMvc.perform(get("/api/transactions/student/1MS21CS001")
                        .with(user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Public and SPA routes can be accessed without authentication")
    void testPublicAndSpaRoutesPermitted() throws Exception {
        mockMvc.perform(get("/login"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/"))
                .andExpect(status().isOk());
    }
}
