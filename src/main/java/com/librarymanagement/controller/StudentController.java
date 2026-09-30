package com.librarymanagement.controller;

import com.librarymanagement.dto.ApiResponse;
import com.librarymanagement.dto.StudentDto;
import com.librarymanagement.entity.Student;
import com.librarymanagement.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    @Autowired
    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudentDto>>> getAllStudents(@RequestParam(required = false) String search) {
        List<StudentDto> students;
        if (search != null && !search.trim().isEmpty()) {
            students = studentService.searchStudents(search);
        } else {
            students = studentService.getAllStudents();
        }
        return ResponseEntity.ok(ApiResponse.success("Students retrieved successfully", students));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentDto>> getStudentById(@PathVariable Long id) {
        StudentDto student = studentService.getStudentById(id);
        return ResponseEntity.ok(ApiResponse.success("Student details retrieved", student));
    }

    @GetMapping("/usn/{usn}")
    public ResponseEntity<ApiResponse<StudentDto>> getStudentByUsn(@PathVariable String usn) {
        StudentDto student = studentService.getStudentByUsn(usn);
        return ResponseEntity.ok(ApiResponse.success("Student details retrieved", student));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudentDto>> addStudent(@RequestBody Student student) {
        StudentDto created = studentService.addStudent(student);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student added successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentDto>> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        StudentDto updated = studentService.updateStudent(id, student);
        return ResponseEntity.ok(ApiResponse.success("Student updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success("Student deleted successfully"));
    }
}
