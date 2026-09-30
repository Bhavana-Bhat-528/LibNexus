/**
 * Main Application Framework JS
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initial view load
    loadDashboardStats();
    
    // Global search enter key trigger
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleGlobalSearch();
        });
    }
});

// View switching function
function switchView(viewId, event) {
    if (event) event.preventDefault();
    
    // Hide all views
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.remove('active');
    });

    // Deactivate all sidebar nav links
    document.querySelectorAll('#mainSidebarNav .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show target view
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Highlight target link
    const targetLink = document.querySelector(`#mainSidebarNav .nav-link[data-view="${viewId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    // Trigger specific data refresh based on view
    if (viewId === 'dashboard') {
        loadDashboardStats();
    } else if (viewId === 'books') {
        loadBooks();
    } else if (viewId === 'students') {
        loadStudents();
    } else if (viewId === 'borrow') {
        initBorrowForm();
    } else if (viewId === 'transactions') {
        loadTransactions();
    }
}

// Global API fetch utility with automatic error handling
async function apiFetch(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            const errorMsg = json.message || `HTTP Error ${response.status}`;
            throw new Error(errorMsg);
        }

        return json;
    } catch (err) {
        console.error(`API Fetch Error [${url}]:`, err);
        throw err;
    }
}

// Toast notification helper
function showToast(message, type = 'info') {
    const toastEl = document.getElementById('appToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toastEl || !toastMessage) return;

    // Reset styles
    toastEl.className = 'toast align-items-center text-white border-0 shadow-lg';
    
    if (type === 'success') {
        toastEl.classList.add('bg-success');
        toastIcon.className = 'bi bi-check-circle-fill fs-5';
    } else if (type === 'danger' || type === 'error') {
        toastEl.classList.add('bg-danger');
        toastIcon.className = 'bi bi-exclamation-triangle-fill fs-5';
    } else if (type === 'warning') {
        toastEl.classList.add('bg-warning', 'text-dark');
        toastIcon.className = 'bi bi-exclamation-circle-fill fs-5';
    } else {
        toastEl.classList.add('bg-primary');
        toastIcon.className = 'bi bi-info-circle-fill fs-5';
    }

    toastMessage.querySelector('span').textContent = message;

    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
}

// Global search bar handler
function handleGlobalSearch() {
    const query = document.getElementById('globalSearchInput').value.trim();
    if (!query) return;

    // Check if query looks like a USN (contains numbers and letters like 1MS...)
    if (/\d/.test(query) && query.length >= 4) {
        // Switch to My Books / Student history view
        document.getElementById('myBooksUsnInput').value = query;
        switchView('my-books');
        loadStudentHistory();
    } else {
        // Switch to Books Catalog view and search title
        document.getElementById('bookSearchInput').value = query;
        switchView('books');
        filterBooksTable();
    }
}
