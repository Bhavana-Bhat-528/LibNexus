/**
 * Transactions, Borrowing & Returning JS Module
 */

let currentReturnTransaction = null;
let returnModalInstance = null;
let currentStudentBorrowInfo = null;

// Dashboard Stats Loader
async function loadDashboardStats() {
    try {
        const res = await apiFetch('/api/dashboard/stats');
        const stats = res.data;

        document.getElementById('dashTotalBooks').textContent = stats.totalBooks || 0;
        document.getElementById('dashAvailableCopies').textContent = stats.totalAvailableCopies || 0;
        document.getElementById('dashTotalStudents').textContent = stats.totalStudents || 0;
        document.getElementById('dashCurrentlyBorrowed').textContent = stats.currentlyBorrowedBooks || 0;
        document.getElementById('dashReturnedBooks').textContent = stats.returnedBooks || 0;
        document.getElementById('dashPendingReturns').textContent = stats.pendingReturns || 0;
        document.getElementById('dashTotalFines').textContent = (stats.totalFinesCollected || 0).toFixed(2);

        // Render Recent Transactions
        renderRecentTransactions(stats.recentTransactions || []);
    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
}

function renderRecentTransactions(transactions) {
    const tableBody = document.getElementById('dashRecentTransactionsTable');
    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No recent transaction history.</td></tr>';
        return;
    }

    tableBody.innerHTML = transactions.map(tx => {
        let statusBadge = tx.status === 'RETURNED' ?
            '<span class="badge badge-returned rounded-pill px-3 py-1">Returned</span>' :
            '<span class="badge badge-borrowed rounded-pill px-3 py-1">Borrowed</span>';

        let returnDateText = tx.returnDate || '<span class="text-warning fw-semibold">Pending</span>';
        let fineText = tx.fine > 0 ? `<span class="text-danger fw-bold">₹${tx.fine.toFixed(2)}</span>` : '<span class="text-muted">₹0.00</span>';

        return `
            <tr>
                <td class="ps-3">
                    <div class="fw-bold text-dark">${escapeHtml(tx.student.name)}</div>
                    <small class="text-muted font-outfit">${escapeHtml(tx.student.usn)}</small>
                </td>
                <td class="fw-semibold text-primary">${escapeHtml(tx.book.title)}</td>
                <td>${tx.issueDate}</td>
                <td>${returnDateText}</td>
                <td>${statusBadge}</td>
                <td class="pe-3">${fineText}</td>
            </tr>
        `;
    }).join('');
}

// BORROW FORM MODULE
async function initBorrowForm() {
    populateBorrowBookDropdowns();
    currentStudentBorrowInfo = null;
    document.getElementById('studentLookupResult').innerHTML = '';
    updateBorrowLimitSummary();
}

async function populateBorrowBookDropdowns() {
    try {
        const res = await apiFetch('/api/books');
        const books = res.data || [];
        
        // Filter available books
        const availableBooks = books.filter(b => b.availableCopies > 0);

        const optionsHtml = '<option value="">-- Select Book --</option>' +
            availableBooks.map(b => `<option value="${b.id}">${escapeHtml(b.title)} (${b.availableCopies} available)</option>`).join('');

        ['borrowBook1', 'borrowBook2', 'borrowBook3'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const val = select.value;
                select.innerHTML = (id === 'borrowBook1') ?
                    '<option value="">-- Select Book 1 * --</option>' + availableBooks.map(b => `<option value="${b.id}">${escapeHtml(b.title)} (${b.availableCopies} left)</option>`).join('') :
                    '<option value="">-- Select Book (Optional) --</option>' + availableBooks.map(b => `<option value="${b.id}">${escapeHtml(b.title)} (${b.availableCopies} left)</option>`).join('');
                select.value = val;
            }
        });
    } catch (err) {
        showToast('Failed to load books for borrowing', 'danger');
    }
}

async function lookupBorrowStudent() {
    const usnInput = document.getElementById('borrowUsnInput');
    const usn = usnInput.value.trim().toUpperCase();
    const resultDiv = document.getElementById('studentLookupResult');

    if (!usn) {
        resultDiv.innerHTML = '';
        currentStudentBorrowInfo = null;
        updateBorrowLimitSummary();
        return;
    }

    try {
        const res = await apiFetch(`/api/students/usn/${usn}`);
        currentStudentBorrowInfo = res.data;

        resultDiv.innerHTML = `
            <div class="card bg-light border-primary border-opacity-25 p-3 rounded-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0 text-dark">${escapeHtml(currentStudentBorrowInfo.name)}</h6>
                        <small class="text-muted">USN: <strong>${escapeHtml(currentStudentBorrowInfo.usn)}</strong> | Contact: ${escapeHtml(currentStudentBorrowInfo.contact)}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${currentStudentBorrowInfo.activeBooksCount >= 3 ? 'bg-danger' : 'bg-success'} fs-7">
                            Active Borrows: ${currentStudentBorrowInfo.activeBooksCount} / 3
                        </span>
                        <div class="fs-8 text-muted mt-1">Remaining slots: <strong>${currentStudentBorrowInfo.remainingBorrowLimit}</strong></div>
                    </div>
                </div>
            </div>
        `;
        updateBorrowLimitSummary();
    } catch (err) {
        currentStudentBorrowInfo = null;
        resultDiv.innerHTML = `
            <div class="alert alert-warning border-0 p-2 fs-7 mb-0 rounded-3">
                <i class="bi bi-exclamation-triangle-fill me-1"></i> ${err.message}. Enter full name when submitting to auto-register new student.
            </div>
        `;
        updateBorrowLimitSummary();
    }
}

function updateBorrowLimitSummary() {
    const summaryBox = document.getElementById('borrowLimitSummaryBox');
    const summaryText = document.getElementById('borrowLimitText');

    const b1 = document.getElementById('borrowBook1').value;
    const b2 = document.getElementById('borrowBook2').value;
    const b3 = document.getElementById('borrowBook3').value;

    const selectedIds = [b1, b2, b3].filter(id => id !== '');
    const selectedCount = selectedIds.length;

    if (!currentStudentBorrowInfo) {
        summaryBox.className = 'alert alert-info border-0 rounded-3 mb-4';
        summaryText.innerHTML = `Please verify student USN above. Currently selected books: <strong>${selectedCount}</strong>.`;
        return;
    }

    const activeCount = currentStudentBorrowInfo.activeBooksCount;
    const remainingLimit = currentStudentBorrowInfo.remainingBorrowLimit;

    if (activeCount >= 3) {
        summaryBox.className = 'alert alert-danger border-0 rounded-3 mb-4';
        summaryText.innerHTML = `❌ Borrow Limit Reached! Student already has <strong>3 active borrowed books</strong>. Cannot issue more books.`;
    } else if (activeCount + selectedCount > 3) {
        summaryBox.className = 'alert alert-warning border-0 rounded-3 mb-4';
        summaryText.innerHTML = `⚠️ Limit Exceeded! Student has ${activeCount} active book(s). Can only borrow <strong>${remainingLimit} more</strong> book(s). You selected ${selectedCount}.`;
    } else {
        summaryBox.className = 'alert alert-success border-0 rounded-3 mb-4';
        summaryText.innerHTML = `✅ Eligible! Student has ${activeCount} active books. Borrowing ${selectedCount} book(s) will leave <strong>${remainingLimit - selectedCount} remaining slot(s)</strong>.`;
    }
}

function resetBorrowForm() {
    document.getElementById('borrowForm').reset();
    currentStudentBorrowInfo = null;
    document.getElementById('studentLookupResult').innerHTML = '';
    updateBorrowLimitSummary();
}

async function handleBorrowSubmit(event) {
    event.preventDefault();

    const usn = document.getElementById('borrowUsnInput').value.trim().toUpperCase();
    const b1 = document.getElementById('borrowBook1').value;
    const b2 = document.getElementById('borrowBook2').value;
    const b3 = document.getElementById('borrowBook3').value;

    const selectedBookIds = [b1, b2, b3].filter(id => id !== '').map(id => parseInt(id));

    if (!usn) {
        showToast('Please enter student USN', 'warning');
        return;
    }

    if (selectedBookIds.length === 0) {
        showToast('Please select at least one book to borrow', 'warning');
        return;
    }

    // Check duplicate book selections in same request
    const uniqueIds = new Set(selectedBookIds);
    if (uniqueIds.size !== selectedBookIds.length) {
        showToast('Please select distinct books in the dropdowns', 'warning');
        return;
    }

    const payload = {
        usn: usn,
        bookIds: selectedBookIds
    };

    try {
        const res = await apiFetch('/api/transactions/borrow', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        showToast('✅ Book(s) borrowed successfully!', 'success');
        resetBorrowForm();
        loadDashboardStats();
        populateBorrowBookDropdowns();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}


// RETURN BOOK MODULE
async function fetchActiveBorrowsForReturn() {
    const usnInput = document.getElementById('returnUsnInput');
    const usn = usnInput.value.trim().toUpperCase();
    const container = document.getElementById('activeBorrowsContainer');
    const infoDiv = document.getElementById('returnStudentInfo');

    if (!usn) {
        showToast('Please enter student USN', 'warning');
        return;
    }

    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-success"></div> Fetching active borrows...</div>';

    try {
        const studentRes = await apiFetch(`/api/students/usn/${usn}`);
        const student = studentRes.data;

        infoDiv.innerHTML = `
            <div class="alert alert-light border p-3 rounded-3 mb-0">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="fw-bold mb-0 text-dark"><i class="bi bi-person-circle text-success me-2"></i>${escapeHtml(student.name)}</h6>
                        <small class="text-muted">USN: <strong>${escapeHtml(student.usn)}</strong> | Contact: ${escapeHtml(student.contact)}</small>
                    </div>
                    <span class="badge bg-success fs-7">Active Borrows: ${student.activeBooksCount}</span>
                </div>
            </div>
        `;

        const txRes = await apiFetch(`/api/transactions/student/${usn}`);
        const allTxs = txRes.data || [];
        const activeTxs = allTxs.filter(t => t.status === 'BORROWED');

        if (activeTxs.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info border-0 text-center py-4 rounded-3">
                    <i class="bi bi-check-circle-fill fs-2 text-info d-block mb-2"></i>
                    Student <strong>${escapeHtml(student.name)}</strong> has no active borrowed books to return.
                </div>
            `;
            return;
        }

        const today = new Date();

        container.innerHTML = `
            <div class="row g-3">
                ${activeTxs.map(tx => {
                    const issueDateStr = tx.issueDate;
                    const issueDate = new Date(issueDateStr);
                    const diffTime = Math.abs(today - issueDate);
                    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    let fineEstimate = 0;
                    if (daysElapsed > 15) {
                        fineEstimate = (daysElapsed - 15) * 2;
                    }

                    return `
                        <div class="col-md-6">
                            <div class="card border border-success border-opacity-25 rounded-3 shadow-sm h-100">
                                <div class="card-body p-3 d-flex flex-column justify-content-between">
                                    <div>
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <h6 class="fw-bold text-dark mb-0">${escapeHtml(tx.book.title)}</h6>
                                            <span class="badge bg-secondary font-outfit">Tx ID: #${tx.id}</span>
                                        </div>
                                        <p class="text-muted fs-7 mb-1"><i class="bi bi-person me-1"></i> Author: ${escapeHtml(tx.book.author)}</p>
                                        <p class="text-muted fs-7 mb-1"><i class="bi bi-calendar-event me-1"></i> Issued: <strong>${tx.issueDate}</strong></p>
                                        <p class="fs-7 mb-2">Days Elapsed: <strong class="${daysElapsed > 15 ? 'text-danger' : 'text-success'}">${daysElapsed} Days</strong></p>
                                    </div>
                                    <div class="pt-3 border-top d-flex justify-content-between align-items-center">
                                        <div>
                                            ${fineEstimate > 0 ? `<span class="badge bg-danger">Estimated Fine: ₹${fineEstimate}</span>` : '<span class="badge bg-success">No Fine</span>'}
                                        </div>
                                        <button class="btn btn-success btn-sm px-3" onclick="openReturnModal(${tx.id}, ${tx.book.id}, '${escapeHtml(tx.book.title)}', '${escapeHtml(tx.student.usn)}', '${tx.issueDate}', ${daysElapsed}, ${fineEstimate})">
                                            <i class="bi bi-box-arrow-in-down me-1"></i> Return Book
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

    } catch (err) {
        infoDiv.innerHTML = '';
        container.innerHTML = `
            <div class="alert alert-danger border-0 text-center py-4 rounded-3">
                <i class="bi bi-exclamation-triangle-fill fs-2 d-block mb-2"></i>
                ${err.message}
            </div>
        `;
    }
}

function openReturnModal(txId, bookId, bookTitle, usn, issueDate, daysElapsed, fine) {
    currentReturnTransaction = { txId, bookId, bookTitle, usn };

    const txIdEl = document.getElementById('returnModalTxId');
    if (txIdEl) txIdEl.textContent = `#TX-${txId}`;

    document.getElementById('returnModalBookTitle').textContent = bookTitle;
    document.getElementById('returnModalUsn').textContent = usn;
    document.getElementById('returnModalIssueDate').textContent = issueDate;
    document.getElementById('returnModalDaysElapsed').textContent = `${daysElapsed} Days`;
    document.getElementById('returnModalFine').textContent = `₹${fine.toFixed(2)}`;

    returnModalInstance = new bootstrap.Modal(document.getElementById('returnModal'));
    returnModalInstance.show();
}

async function executeReturn() {
    if (!currentReturnTransaction || !currentReturnTransaction.txId) return;

    try {
        const res = await apiFetch(`/api/transactions/return/${currentReturnTransaction.txId}`, {
            method: 'POST'
        });

        if (returnModalInstance) returnModalInstance.hide();
        const successMsg = res.message || 'Book returned successfully!';
        showToast(successMsg, 'success');

        fetchActiveBorrowsForReturn();
        loadDashboardStats();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

// MY BOOKS / STUDENT HISTORY MODULE
async function loadStudentHistory() {
    const usnInput = document.getElementById('myBooksUsnInput');
    const usn = usnInput.value.trim().toUpperCase();
    const resultDiv = document.getElementById('studentHistoryResult');

    if (!usn) {
        showToast('Please enter a student USN', 'warning');
        return;
    }

    resultDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div> Loading student history...</div>';

    try {
        const studentRes = await apiFetch(`/api/students/usn/${usn}`);
        const student = studentRes.data;

        const txRes = await apiFetch(`/api/transactions/student/${usn}`);
        const transactions = txRes.data || [];

        const activeBorrows = transactions.filter(t => t.status === 'BORROWED');
        const returnedHistory = transactions.filter(t => t.status === 'RETURNED');

        resultDiv.innerHTML = `
            <div class="card border-0 shadow-sm rounded-3 mb-4">
                <div class="card-body p-4 bg-primary text-white rounded-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge bg-white bg-opacity-20 text-white mb-2">Student Profile</span>
                            <h3 class="fw-bold font-outfit mb-1">${escapeHtml(student.name)}</h3>
                            <p class="mb-0 text-white-50 fs-7"><i class="bi bi-card-text me-1"></i> USN: <strong>${escapeHtml(student.usn)}</strong> | <i class="bi bi-telephone me-1"></i> Contact: ${escapeHtml(student.contact)}</p>
                        </div>
                        <div class="text-end">
                            <div class="bg-white bg-opacity-20 p-3 rounded-3 text-center">
                                <span class="fs-7 text-white-50 text-uppercase">Active Borrows</span>
                                <h3 class="fw-bold mb-0">${student.activeBooksCount} / 3</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Currently Borrowed Books Section -->
            <div class="card border-0 shadow-sm rounded-3 mb-4">
                <div class="card-header bg-white py-3 border-bottom">
                    <h6 class="fw-bold font-outfit mb-0 text-warning"><i class="bi bi-clock-history me-1"></i> Currently Borrowed Books (${activeBorrows.length})</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light fs-7 text-uppercase text-muted">
                                <tr>
                                    <th class="ps-3">Book Title</th>
                                    <th>Category</th>
                                    <th>Issue Date</th>
                                    <th>Status</th>
                                    <th class="pe-3 text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${activeBorrows.length === 0 ? '<tr><td colspan="5" class="text-center py-4 text-muted">No currently borrowed books.</td></tr>' : 
                                    activeBorrows.map(tx => `
                                        <tr>
                                            <td class="ps-3 fw-bold text-dark">${escapeHtml(tx.book.title)}</td>
                                            <td><span class="badge bg-light text-dark border">${escapeHtml(tx.book.category)}</span></td>
                                            <td>${tx.issueDate}</td>
                                            <td><span class="badge badge-borrowed rounded-pill px-3 py-1">Currently Borrowed</span></td>
                                            <td class="pe-3 text-end">
                                                <button class="btn btn-sm btn-outline-success" onclick="quickReturnFromHistory(${tx.id}, ${tx.book.id}, '${escapeHtml(tx.book.title)}', '${escapeHtml(student.usn)}', '${tx.issueDate}')">
                                                    <i class="bi bi-box-arrow-in-down me-1"></i> Return
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Previously Returned History Section -->
            <div class="card border-0 shadow-sm rounded-3">
                <div class="card-header bg-white py-3 border-bottom">
                    <h6 class="fw-bold font-outfit mb-0 text-success"><i class="bi bi-journal-check me-1"></i> Return History (${returnedHistory.length})</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light fs-7 text-uppercase text-muted">
                                <tr>
                                    <th class="ps-3">Book Title</th>
                                    <th>Issue Date</th>
                                    <th>Return Date</th>
                                    <th>Status</th>
                                    <th class="pe-3 text-end">Fine Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${returnedHistory.length === 0 ? '<tr><td colspan="5" class="text-center py-4 text-muted">No previously returned history.</td></tr>' : 
                                    returnedHistory.map(tx => `
                                        <tr>
                                            <td class="ps-3 fw-bold text-dark">${escapeHtml(tx.book.title)}</td>
                                            <td>${tx.issueDate}</td>
                                            <td>${tx.returnDate}</td>
                                            <td><span class="badge badge-returned rounded-pill px-3 py-1">Returned</span></td>
                                            <td class="pe-3 text-end fw-semibold ${tx.fine > 0 ? 'text-danger' : 'text-muted'}">₹${(tx.fine || 0).toFixed(2)}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger border-0 text-center py-4 rounded-3">
                <i class="bi bi-exclamation-circle-fill fs-2 d-block mb-2"></i>
                ${err.message}
            </div>
        `;
    }
}

function quickReturnFromHistory(txId, bookId, bookTitle, usn, issueDate) {
    document.getElementById('returnUsnInput').value = usn;
    switchView('return');
    
    const today = new Date();
    const issueDateObj = new Date(issueDate);
    const diffTime = Math.abs(today - issueDateObj);
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let fineEstimate = daysElapsed > 15 ? (daysElapsed - 15) * 2 : 0;
    
    openReturnModal(txId, bookId, bookTitle, usn, issueDate, daysElapsed, fineEstimate);
}

// TRANSACTIONS HISTORY MODULE
let cachedTransactions = [];

async function loadTransactions() {
    const tableBody = document.getElementById('transactionsTableBody');
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading transaction history...</td></tr>';

    try {
        const res = await apiFetch('/api/transactions');
        cachedTransactions = res.data || [];
        renderTransactionsTable(cachedTransactions);
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4"><i class="bi bi-exclamation-octagon me-1"></i> Failed to load transactions: ${err.message}</td></tr>`;
        showToast(err.message, 'danger');
    }
}

function renderTransactionsTable(transactions) {
    const tableBody = document.getElementById('transactionsTableBody');

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No transaction records found.</td></tr>';
        return;
    }

    tableBody.innerHTML = transactions.map(tx => {
        let statusBadge = tx.status === 'RETURNED' ?
            '<span class="badge badge-returned rounded-pill px-3 py-1">Returned</span>' :
            '<span class="badge badge-borrowed rounded-pill px-3 py-1">Borrowed</span>';

        let fineText = tx.fine > 0 ? `<span class="text-danger fw-bold">₹${tx.fine.toFixed(2)}</span>` : '<span class="text-muted">₹0.00</span>';

        return `
            <tr>
                <td class="ps-3 fw-bold text-secondary">#TX-${tx.id}</td>
                <td>
                    <div class="fw-bold text-dark">${escapeHtml(tx.student.name)}</div>
                </td>
                <td><span class="badge bg-light text-dark border font-outfit">${escapeHtml(tx.student.usn)}</span></td>
                <td class="fw-semibold text-primary">${escapeHtml(tx.book.title)}</td>
                <td>${tx.issueDate}</td>
                <td>${tx.returnDate || '<span class="text-warning fw-semibold">Pending</span>'}</td>
                <td>${statusBadge}</td>
                <td class="pe-3 text-end">${fineText}</td>
            </tr>
        `;
    }).join('');
}

function filterTransactions() {
    const usnVal = document.getElementById('txUsnFilter').value.toLowerCase().trim();
    const statusVal = document.getElementById('txStatusFilter').value;
    const searchVal = document.getElementById('txSearchFilter').value.toLowerCase().trim();

    const filtered = cachedTransactions.filter(tx => {
        const matchesUsn = !usnVal || tx.student.usn.toLowerCase().includes(usnVal);
        const matchesStatus = (statusVal === 'ALL' || tx.status === statusVal);
        const matchesSearch = !searchVal ||
            tx.book.title.toLowerCase().includes(searchVal) ||
            tx.student.name.toLowerCase().includes(searchVal);

        return matchesUsn && matchesStatus && matchesSearch;
    });

    renderTransactionsTable(filtered);
}

function resetTxFilters() {
    document.getElementById('txUsnFilter').value = '';
    document.getElementById('txStatusFilter').value = 'ALL';
    document.getElementById('txSearchFilter').value = '';
    renderTransactionsTable(cachedTransactions);
}
