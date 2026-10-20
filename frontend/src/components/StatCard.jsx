import React from 'react';

export const StatCard = ({ title, value, icon, gradient, subtitle, textColor = 'text-white' }) => {
  const getIconColorClass = () => {
    if (!gradient) return 'text-primary';
    if (gradient.includes('success')) return 'text-success';
    if (gradient.includes('primary')) return 'text-primary';
    if (gradient.includes('warning')) return 'text-warning';
    if (gradient.includes('info')) return 'text-info';
    if (gradient.includes('danger')) return 'text-danger';
    return 'text-primary';
  };

  const isBootstrapIcon = typeof icon === 'string' && (icon.startsWith('bi-') || icon.startsWith('bi '));

  return (
    <div className={`card stat-card ${gradient ? gradient : 'bg-white'} border-0 shadow-sm rounded-3 h-100`}>
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <span className={`fs-7 text-uppercase fw-semibold ${gradient ? 'opacity-75' : 'text-muted'}`}>
              {title}
            </span>
            <h2 className={`fw-bold mb-0 mt-1 font-outfit ${gradient ? textColor : 'text-dark'}`}>
              {value}
            </h2>
            {subtitle && (
              <small className={`d-block mt-1 ${gradient ? 'opacity-75' : 'text-muted'} fs-8`}>
                {subtitle}
              </small>
            )}
          </div>
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${
              gradient ? 'bg-white' : 'bg-primary bg-opacity-10 text-primary'
            }`}
            style={{ width: '56px', height: '56px', minWidth: '56px' }}
          >
            {isBootstrapIcon ? (
              <i className={`bi ${icon.replace(/^bi\s+/, '')} fs-3 ${getIconColorClass()}`}></i>
            ) : (
              <span className="fs-3">{icon}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
