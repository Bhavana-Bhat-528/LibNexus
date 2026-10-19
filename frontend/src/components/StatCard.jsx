import React from 'react';

export const StatCard = ({ title, value, icon, gradient, subtitle, textColor = 'text-white' }) => {
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
          <div className={`p-3 rounded-circle d-flex align-items-center justify-content-center ${gradient ? 'bg-white bg-opacity-20' : 'bg-light text-primary'}`} style={{ width: '56px', height: '56px' }}>
            <i className={`bi ${icon} fs-3`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};
