package com.librarymanagement.service;

import com.librarymanagement.dto.StudentDto;
import com.librarymanagement.dto.StudentRegistrationRequest;
import com.librarymanagement.entity.Role;
import com.librarymanagement.entity.Student;
import com.librarymanagement.entity.TransactionStatus;
import com.librarymanagement.entity.User;
import com.librarymanagement.exception.BadRequestException;
import com.librarymanagement.exception.ResourceNotFoundException;
import com.librarymanagement.repository.StudentRepository;
import com.librarymanagement.repository.TransactionRepository;
import com.librarymanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public StudentService(StudentRepository studentRepository,
                          TransactionRepository transactionRepository,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<StudentDto> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public StudentDto getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));
        return convertToDto(student);
    }

    public StudentDto getStudentByUsn(String usn) {
        Student student = getStudentEntityByUsn(usn);
        return convertToDto(student);
    }

    public Student getStudentEntityByUsn(String usn) {
        if (usn == null || usn.trim().isEmpty()) {
            throw new BadRequestException("USN cannot be empty");
        }
        return studentRepository.findByUsnIgnoreCase(usn.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with USN: " + usn.trim()));
    }

    public List<StudentDto> searchStudents(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllStudents();
        }
        String q = query.trim();
        return studentRepository.findByNameContainingIgnoreCaseOrUsnContainingIgnoreCase(q, q).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentDto registerStudent(StudentRegistrationRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Student name cannot be empty");
        }
        if (request.getUsn() == null || request.getUsn().trim().isEmpty()) {
            throw new BadRequestException("USN cannot be empty");
        }
        if (request.getContact() == null || request.getContact().trim().isEmpty()) {
            throw new BadRequestException("Contact details cannot be empty");
        }

        String trimmedUsn = request.getUsn().trim().toUpperCase();
        if (studentRepository.existsByUsnIgnoreCase(trimmedUsn)) {
            throw new BadRequestException("Student with USN '" + trimmedUsn + "' already exists");
        }

        Student student = new Student(
                request.getName().trim(),
                trimmedUsn,
                request.getContact().trim()
        );
        Student saved = studentRepository.save(student);

        // Determine username
        String username = request.getUsername();
        if (username == null || username.trim().isEmpty()) {
            username = trimmedUsn.toLowerCase();
        } else {
            username = username.trim().toLowerCase();
        }

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            username = trimmedUsn.toLowerCase();
            if (userRepository.existsByUsernameIgnoreCase(username)) {
                username = trimmedUsn.toLowerCase() + "_" + saved.getId();
            }
        }

        // Determine password (given by librarian or provided by student)
        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            rawPassword = "student123";
        } else {
            rawPassword = rawPassword.trim();
        }

        User user = new User(
                username,
                passwordEncoder.encode(rawPassword),
                Role.ROLE_STUDENT,
                saved
        );
        userRepository.save(user);

        return convertToDto(saved);
    }

    @Transactional
    public StudentDto addStudent(Student student) {
        StudentRegistrationRequest req = new StudentRegistrationRequest(
                student.getName(),
                student.getUsn(),
                student.getContact(),
                null,
                null
        );
        return registerStudent(req);
    }

    @Transactional
    public StudentDto updateStudent(Long id, Student updatedStudent) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        if (updatedStudent.getUsn() != null && !updatedStudent.getUsn().trim().isEmpty()) {
            String trimmedUsn = updatedStudent.getUsn().trim().toUpperCase();
            if (!existing.getUsn().equalsIgnoreCase(trimmedUsn) && studentRepository.existsByUsnIgnoreCase(trimmedUsn)) {
                throw new BadRequestException("Another student with USN '" + trimmedUsn + "' already exists");
            }
            existing.setUsn(trimmedUsn);
        }

        if (updatedStudent.getName() != null && !updatedStudent.getName().trim().isEmpty()) {
            existing.setName(updatedStudent.getName().trim());
        }

        if (updatedStudent.getContact() != null && !updatedStudent.getContact().trim().isEmpty()) {
            existing.setContact(updatedStudent.getContact().trim());
        }

        Student saved = studentRepository.save(existing);
        return convertToDto(saved);
    }

    @Transactional
    public StudentDto updateStudentCredentials(Long id, String username, String newPassword) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        User user = userRepository.findByStudentUsnIgnoreCase(student.getUsn())
                .orElseGet(() -> {
                    User u = new User();
                    u.setRole(Role.ROLE_STUDENT);
                    u.setStudent(student);
                    u.setEnabled(true);
                    return u;
                });

        if (username != null && !username.trim().isEmpty()) {
            String cleanUsername = username.trim().toLowerCase();
            if (!cleanUsername.equalsIgnoreCase(user.getUsername()) && userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
                throw new BadRequestException("Username '" + cleanUsername + "' is already in use");
            }
            user.setUsername(cleanUsername);
        } else if (user.getUsername() == null) {
            user.setUsername(student.getUsn().toLowerCase());
        }

        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(newPassword.trim()));
        } else if (user.getPassword() == null) {
            user.setPassword(passwordEncoder.encode("student123"));
        }

        userRepository.save(user);
        return convertToDto(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        int activeBooks = transactionRepository.countByStudentUsnIgnoreCaseAndStatus(student.getUsn(), TransactionStatus.BORROWED);
        if (activeBooks > 0) {
            throw new BadRequestException("Cannot delete student with active borrowed books. Please return all books first.");
        }

        userRepository.findByStudentUsnIgnoreCase(student.getUsn()).ifPresent(userRepository::delete);
        studentRepository.delete(student);
    }

    public StudentDto convertToDto(Student student) {
        int activeCount = transactionRepository.countByStudentUsnIgnoreCaseAndStatus(student.getUsn(), TransactionStatus.BORROWED);
        StudentDto dto = new StudentDto(student, activeCount);
        userRepository.findByStudentUsnIgnoreCase(student.getUsn()).ifPresentOrElse(user -> {
            dto.setUsername(user.getUsername());
            dto.setHasLoginAccount(true);
        }, () -> {
            dto.setUsername(student.getUsn().toLowerCase());
            dto.setHasLoginAccount(false);
        });
        return dto;
    }
}
