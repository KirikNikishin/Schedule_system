import React from 'react';
import './NavigationTabs.css'; // Используются те же стили

const PeriodTabs = ({ selectedSemester, onSelect }) => {
  const numbers = Array.from({ length: 11 }, (_, i) => i + 1);

  return (
    <div className="number-tabs-wrapper">
      <div className="number-segmented-control">
        {numbers.map((num) => (
          <div
            key={num}
            className={`number-tab-item ${selectedSemester === num ? 'active-number-tab' : ''}`}
            onClick={() => onSelect(num)}
            style={{ cursor: 'pointer' }}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeriodTabs;
