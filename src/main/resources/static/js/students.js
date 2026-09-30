/**
 * Students Directory JS Module
 */

let cachedStudents = [];
let studentModalInstance = null;

async function loadStudents() {
    const tableBody = document.getElementById('studentsTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading student directory...</td></tr>';

    try {
        const res = await apiFetch('/api/students');
        cachedStudents = res.data || [];
        renderStudentsTable(cachedStudents);
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="bi bi-exclamation-octagon me-1"></i> Failed to load students: ${err.message}</td></tr>`;
        showToast(err.message, 'danger');
    }
}

function renderStudentsTable(students) {
    const tableBody = document.getElementById('studentsTableBody');

    if (!students || students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No students registered yet.</td></tr>';
        return;
    }

    tableBody.innerHTML = students.map(student => {
        let activeBadge = `<span class="badge bg-secondary rounded-pill px-3 py-1">${student.activeBooksCount} / 3</span>`;
        if (student.activeBooksCount >= 3) {
            activeBadge = `<span class="badge bg-danger rounded-pill px-3 py-1">Max Limit (${student.activeBooksCount}/3)</span>`;
        } else if (student.activeBooksCount > 0) {
            activeBadge = `<span class="badge bg-warning text-dark rounded-pill px-3 py-1">${student.activeBooksCount} Active</span>`;
        }

        return `
            <tr>
                <td class="ps-3 fw-bold text-secondary">#${student.id}</td>
                <td>
                    <div class="fw-bold text-dark">${escapeHtml(student.name)}</div>
                </td>
                <td><span class="badge bg-dark-subtle text-dark border font-outfit fw-semibold px-2 py-1">${escapeHtml(student.usn)}</span></td>
                <td class="text-muted"><i class="bi bi-telephone me-1"></i>${escapeHtml(student.contact)}</td>
                <td>${activeBadge}</td>
                <td><span class="text-success fw-bold">${student.remainingBorrowLimit} Slots Available</span></td>
                <td class="pe-3 text-end">
                    <button class="btn btn-sm btn-outline-info me-1" onclick="viewStudentHistory('${student.usn}')" title="View History">
                        <i class="bi bi-journal-text"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditStudentModal(${student.id})" title="Edit Student">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})" title="Delete Student">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterStudentsTable() {
    const query = document.getElementById('studentSearchInput').value.toLowerCase().trim();
    const filtered = cachedStudents.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.usn.toLowerCase().includes(query)
    );
    renderStudentsTable(filtered);
}

function openAddStudentModal() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentIdInput').value = '';
    document.getElementById('studentModalTitle').textContent = 'Add New Student';

    studentModalInstance = new bootstrap.Modal(document.getElementById('studentModal'));
    studentModalInstance.show();
}

function openEditStudentModal(id) {
    const student = cachedStudents.find(s => s.id === id);
    if (!student) return;

    document.getElementById('studentIdInput').value = student.id;
    document.getElementById('studentNameInput').value = student.name;
    document.getElementById('studentUsnInput').value = student.usn;
    document.getElementById('studentContactInput').value = student.contact;

    document.getElementById('studentModalTitle').textContent = 'Edit Student Details';

    studentModalInstance = new bootstrap.Modal(document.getElementById('studentModal'));
    studentModalInstance.show();
}

async function handleStudentFormSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('studentIdInput').value;
    const name = document.getElementById('studentNameInput').value.trim();
    const usn = document.getElementById('studentUsnInput').value.trim().toUpperCase();
    const contact = document.getElementById('studentContactInput').value.trim();

    const payload = { name, usn, contact };

    try {
        if (id) {
            await apiFetch(`/api/students/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showToast('Student updated successfully!', 'success');
        } else {
            await apiFetch('/api/students', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showToast('Student registered successfully!', 'success');
        }

        if (studentModalInstance) studentModalInstance.hide();
        loadStudents();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

async function deleteStudent(id) {
    const student = cachedStudents.find(s => s.id === id);
    if (!student) return;

    if (!confirm(`Are you sure you want to delete student '${student.name}' (${student.usn})?`)) return;

    try {
        await apiFetch(`/api/students/${id}`, { method: 'DELETE' });
        showToast('Student removed successfully', 'success');
        loadStudents();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

function viewStudentHistory(usn) {
    document.getElementById('myBooksUsnInput').value = usn;
    switchView('my-books');
    loadStudentHistory();
}
