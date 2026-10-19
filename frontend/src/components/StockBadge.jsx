import React from 'react';

export const StockBadge = ({ availableCopies }) => {
  if (availableCopies <= 0) {
    return (
      <span className="badge badge-out-of-stock rounded-pill px-3 py-1">
        <i className="bi bi-x-circle me-1"></i> Out of Stock
      </span>
    );
  }
  if (availableCopies <= 2) {
    return (
      <span className="badge badge-low-stock rounded-pill px-3 py-1">
        <i className="bi bi-exclamation-triangle me-1"></i> Low Stock ({availableCopies})
      </span>
    );
  }
  return (
    <span className="badge badge-available rounded-pill px-3 py-1">
      <i className="bi bi-check-circle me-1"></i> Available ({availableCopies})
    </span>
  );
};
