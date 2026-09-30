package com.librarymanagement.service;

import com.librarymanagement.dto.StudentDto;
import com.librarymanagement.entity.Student;
import com.librarymanagement.entity.TransactionStatus;
import com.librarymanagement.exception.BadRequestException;
import com.librarymanagement.exception.ResourceNotFoundException;
import com.librarymanagement.repository.StudentRepository;
import com.librarymanagement.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final TransactionRepository transactionRepository;

    @Autowired
    public StudentService(StudentRepository studentRepository, TransactionRepository transactionRepository) {
        this.studentRepository = studentRepository;
        this.transactionRepository = transactionRepository;
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
    public StudentDto addStudent(Student student) {
        validateStudentInput(student);

        String trimmedUsn = student.getUsn().trim().toUpperCase();
        if (studentRepository.existsByUsnIgnoreCase(trimmedUsn)) {
            throw new BadRequestException("Student with USN '" + trimmedUsn + "' already exists");
        }

        student.setUsn(trimmedUsn);
        student.setName(student.getName().trim());
        student.setContact(student.getContact().trim());

        Student saved = studentRepository.save(student);
        return convertToDto(saved);
    }

    private void validateStudentInput(Student student) {
        if (student.getName() == null || student.getName().trim().isEmpty()) {
            throw new BadRequestException("Student name cannot be empty");
        }
        if (student.getUsn() == null || student.getUsn().trim().isEmpty()) {
            throw new BadRequestException("USN cannot be empty");
        }
        if (student.getContact() == null || student.getContact().trim().isEmpty()) {
            throw new BadRequestException("Contact details cannot be empty");
        }
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
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        int activeBooks = transactionRepository.countByStudentUsnIgnoreCaseAndStatus(student.getUsn(), TransactionStatus.BORROWED);
        if (activeBooks > 0) {
            throw new BadRequestException("Cannot delete student with active borrowed books. Please return all books first.");
        }

        studentRepository.delete(student);
    }

    public StudentDto convertToDto(Student student) {
        int activeCount = transactionRepository.countByStudentUsnIgnoreCaseAndStatus(student.getUsn(), TransactionStatus.BORROWED);
        return new StudentDto(student, activeCount);
    }
}
