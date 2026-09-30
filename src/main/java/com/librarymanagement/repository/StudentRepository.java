package com.librarymanagement.repository;

import com.librarymanagement.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUsnIgnoreCase(String usn);

    boolean existsByUsnIgnoreCase(String usn);

    List<Student> findByNameContainingIgnoreCaseOrUsnContainingIgnoreCase(String name, String usn);
}
