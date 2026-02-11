import React from 'react';
import type { SortField, SortDirection } from '../../types';
import './SortControls.css';

interface SortControlsProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const SortControls: React.FC<SortControlsProps> = ({
  sortField,
  sortDirection,
  onSortChange,
}) => {
  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(field, newDirection);
    } else {
      onSortChange(field, 'asc');
    }
  };

  return (
    <nav className="sort-controls">
      <h3 className="sort-controls__title">Сортировка</h3>
      <div className="sort-controls__buttons">
        <button className={`sort-controls__button ${sortField === 'year' ? 'sort-controls__button--active' : ''}`} onClick={() => handleSortClick('year')}>По году{sortField === 'year' && (
            <span className="sort-controls__arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
        </button>
        <button className={`sort-controls__button ${sortField === 'price' ? 'sort-controls__button--active' : ''}`}onClick={() => handleSortClick('price')}>По цене{sortField === 'price' && (
            <span className="sort-controls__arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
        </button>
        <button className="sort-controls__button" onClick={() => handleSortClick('none')}>Без сортировки</button>
      </div>
    </nav>
  );
};

export default SortControls;