import React, { useEffect } from 'react';
import './NavigationTabs.css';

export default function ProgramTabs({ programs, selected, onSelect }) {
  const codes = [...new Set(Object.values(programs))].sort();

  // Устанавливаем первое направление при первом рендере
  useEffect(() => {
    if (!selected && codes.length > 0) {
      onSelect(codes[0]);
    }
  }, [selected, codes, onSelect]);

  return (
    <div className='program-segmented-control'>
      {codes.map(code => {
        const isActive = selected === code;
        return (
          <div
            key={code}
            onClick={() => onSelect(code)}
            style={{
              alignItems: 'center',
              padding: '4px 12px',
              borderRadius: '4px',
              height: '32px',
              backgroundColor: isActive ? '#ffffff' : '#f7f7f7',
              color: '#000',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {code}
          </div>
        );
      })}
    </div>
  );
}
