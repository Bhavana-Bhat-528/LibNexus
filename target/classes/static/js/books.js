/**
 * Books Catalog JS Module
 */

let cachedBooks = [];
let bookModalInstance = null;

async function loadBooks() {
    const tableBody = document.getElementById('booksTableBody');
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading catalog...</td></tr>';

    try {
        const res = await apiFetch('/api/books');
        cachedBooks = res.data || [];
        renderBooksTable(cachedBooks);
        loadCategories();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4"><i class="bi bi-exclamation-octagon me-1"></i> Failed to load books: ${err.message}</td></tr>`;
        showToast(err.message, 'danger');
    }
}

function renderBooksTable(books) {
    const tableBody = document.getElementById('booksTableBody');
    
    if (!books || books.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No books found in the library.</td></tr>';
        return;
    }

    tableBody.innerHTML = books.map(book => {
        let statusBadge = '';
        if (book.availableCopies <= 0) {
            statusBadge = '<span class="badge badge-out-of-stock rounded-pill px-3 py-1">Out of Stock</span>';
        } else if (book.availableCopies <= 2) {
            statusBadge = `<span class="badge badge-low-stock rounded-pill px-3 py-1">Low Stock (${book.availableCopies})</span>`;
        } else {
            statusBadge = '<span class="badge badge-available rounded-pill px-3 py-1">Available</span>';
        }

        return `
            <tr>
                <td class="ps-3 fw-bold text-secondary">#${book.id}</td>
                <td>
                    <div class="fw-bold text-dark">${escapeHtml(book.title)}</div>
                </td>
                <td class="text-muted">${escapeHtml(book.author)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(book.category)}</span></td>
                <td>${book.totalCopies}</td>
                <td class="fw-bold text-primary">${book.availableCopies}</td>
                <td>${statusBadge}</td>
                <td class="pe-3 text-end">
                    <button class="btn btn-sm btn-outline-info me-1" onclick="checkBookAvailabilityModal(${book.id})" title="Check Availability">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditBookModal(${book.id})" title="Edit Book">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBook(${book.id})" title="Delete Book">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadCategories() {
    try {
        const res = await apiFetch('/api/books/categories');
        const categories = res.data || [];
        const select = document.getElementById('bookCategorySelect');
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="ALL">All Categories</option>' +
            categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        select.value = currentValue;
    } catch (err) {
        console.error('Failed to load categories', err);
    }
}

function filterBooksTable() {
    const searchQuery = document.getElementById('bookSearchInput').value.toLowerCase().trim();
    const categoryQuery = document.getElementById('bookCategorySelect').value;

    const filtered = cachedBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery) ||
                             book.author.toLowerCase().includes(searchQuery);
        const matchesCategory = (categoryQuery === 'ALL' || book.category.equalsIgnoreCase ? book.category.equalsIgnoreCase(categoryQuery) : book.category.toLowerCase() === categoryQuery.toLowerCase());
        return matchesSearch && matchesCategory;
    });

    renderBooksTable(filtered);
}

function openAddBookModal() {
    document.getElementById('bookForm').reset();
    document.getElementById('bookIdInput').value = '';
    document.getElementById('bookModalTitle').textContent = 'Add New Book';
    document.getElementById('bookAvailableCopiesInput').value = '5';
    document.getElementById('bookTotalCopiesInput').value = '5';

    bookModalInstance = new bootstrap.Modal(document.getElementById('bookModal'));
    bookModalInstance.show();
}

function openEditBookModal(id) {
    const book = cachedBooks.find(b => b.id === id);
    if (!book) return;

    document.getElementById('bookIdInput').value = book.id;
    document.getElementById('bookTitleInput').value = book.title;
    document.getElementById('bookAuthorInput').value = book.author;
    document.getElementById('bookCategoryInput').value = book.category;
    document.getElementById('bookTotalCopiesInput').value = book.totalCopies;
    document.getElementById('bookAvailableCopiesInput').value = book.availableCopies;

    document.getElementById('bookModalTitle').textContent = 'Edit Book Details';

    bookModalInstance = new bootstrap.Modal(document.getElementById('bookModal'));
    bookModalInstance.show();
}

async function handleBookFormSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('bookIdInput').value;
    const title = document.getElementById('bookTitleInput').value.trim();
    const author = document.getElementById('bookAuthorInput').value.trim();
    const category = document.getElementById('bookCategoryInput').value.trim();
    const totalCopies = parseInt(document.getElementById('bookTotalCopiesInput').value);
    const availableCopies = parseInt(document.getElementById('bookAvailableCopiesInput').value);

    const payload = { title, author, category, totalCopies, availableCopies };

    try {
        if (id) {
            await apiFetch(`/api/books/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showToast('Book updated successfully!', 'success');
        } else {
            await apiFetch('/api/books', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showToast('New book added to library catalog!', 'success');
        }

        if (bookModalInstance) bookModalInstance.hide();
        loadBooks();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

async function deleteBook(id) {
    const book = cachedBooks.find(b => b.id === id);
    if (!book) return;

    if (!confirm(`Are you sure you want to delete '${book.title}' from the catalog?`)) return;

    try {
        await apiFetch(`/api/books/${id}`, { method: 'DELETE' });
        showToast('Book removed successfully', 'success');
        loadBooks();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

async function checkBookAvailabilityModal(id) {
    try {
        const res = await apiFetch(`/api/books/${id}/availability`);
        const data = res.data;

        let statusClass = 'text-success';
        if (data.status === 'OUT_OF_STOCK') statusClass = 'text-danger';
        else if (data.status === 'LOW_STOCK') statusClass = 'text-warning';

        alert(`📚 ${data.title}\nAuthor: ${data.author}\nCategory: ${data.category}\nTotal Copies: ${data.totalCopies}\nAvailable Copies: ${data.availableCopies}\nStatus: ${data.status}`);
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
