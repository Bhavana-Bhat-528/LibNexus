-- =============================================================================
-- SQL CLEANUP SCRIPT FOR DUPLICATE ACTIVE TRANSACTIONS IN LIBRARYSYSTEM
-- =============================================================================
-- Explanation:
-- This script identifies duplicate active ('BORROWED') transaction records where
-- the same student has multiple active rows for the exact same book.
--
-- To preserve historical data without deleting records:
-- 1. It keeps the latest active borrow record (highest ID) as 'BORROWED'.
-- 2. It marks older duplicate active records as 'RETURNED' with return_date set to CURRENT_DATE.
-- 3. It recalculates and synchronizes available_copies for affected books.
-- =============================================================================

USE LibraryDB;

-- Step 1: Preview duplicate active records before cleanup
SELECT 
    t.student_id, 
    s.usn, 
    s.name AS student_name, 
    t.book_id, 
    b.title AS book_title, 
    COUNT(*) AS active_duplicate_count
FROM transactions t
JOIN students s ON t.student_id = s.id
JOIN books b ON t.book_id = b.id
WHERE t.status = 'BORROWED'
GROUP BY t.student_id, s.usn, s.name, t.book_id, b.title
HAVING COUNT(*) > 1;

-- Step 2: Safely update older duplicate active records to 'RETURNED' status, keeping the newest record active
UPDATE transactions t
JOIN (
    SELECT t1.id
    FROM transactions t1
    JOIN (
        SELECT student_id, book_id, MAX(id) AS latest_id
        FROM transactions
        WHERE status = 'BORROWED'
        GROUP BY student_id, book_id
        HAVING COUNT(*) > 1
    ) dup ON t1.student_id = dup.student_id 
         AND t1.book_id = dup.book_id 
         AND t1.id < dup.latest_id
    WHERE t1.status = 'BORROWED'
) to_resolve ON t.id = to_resolve.id
SET t.status = 'RETURNED',
    t.return_date = CURRENT_DATE,
    t.fine = 0.0;

-- Step 3: Synchronize available_copies in books table based on actual active borrows
UPDATE books b
SET b.available_copies = b.total_copies - (
    SELECT COUNT(*) 
    FROM transactions t 
    WHERE t.book_id = b.id AND t.status = 'BORROWED'
);

-- Step 4: Verify duplicate cleanup completed cleanly
SELECT 
    t.id AS transaction_id, 
    s.usn, 
    b.title AS book_title, 
    t.issue_date, 
    t.return_date, 
    t.status 
FROM transactions t
JOIN students s ON t.student_id = s.id
JOIN books b ON t.book_id = b.id
ORDER BY t.id DESC;
