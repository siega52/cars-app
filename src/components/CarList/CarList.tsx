import React from 'react';
import type { Car } from '../../types';
import './CarList.css';

interface CarListProps {
  cars: Car[];
  onEdit: (car: Car) => void;
  onDelete: (id: number) => void;
}

const CarList: React.FC<CarListProps> = ({ cars, onEdit, onDelete }) => {
  if (cars.length === 0) {
    return (
      <section className="car-list">
        <p className="car-list__empty">Автомобили не найдены</p>
      </section>
    );
  }

  return (
    <section className="car-list">
      <header className="car-list__header">
        <h2 className="car-list__title">Список автомобилей</h2>
        <p className="car-list__count">Найдено: {cars.length} автомобилей</p>
      </header>

      <div className="car-list__grid">
        {cars.map(car => (
          <article key={car.id} className="car-card">
            <div className="car-card__color" style={{ backgroundColor: car.color }}></div>
            <div className="car-card__content">
              <h3 className="car-card__title">
                {car.name} {car.model}
              </h3>
              <dl className="car-card__details">
                <div className="car-card__detail">
                  <dt className="car-card__term">Год:</dt>
                  <dd className="car-card__value">{car.year}</dd>
                </div>
                <div className="car-card__detail">
                  <dt className="car-card__term">Цена:</dt>
                  <dd className="car-card__value">${car.price.toLocaleString()}</dd>
                </div>
                <div className="car-card__detail">
                  <dt className="car-card__term">Цвет:</dt>
                  <dd className="car-card__value">{car.color}</dd>
                </div>
                <div className="car-card__detail">
                  <dt className="car-card__term">Координаты:</dt>
                  <dd className="car-card__value">
                    {car.latitude.toFixed(6)}, {car.longitude.toFixed(6)}
                  </dd>
                </div>
              </dl>
            </div>
            <footer className="car-card__footer">
              <button
                className="car-card__button car-card__button--edit"
                onClick={() => onEdit(car)}
              >
                Редактировать
              </button>
              <button
                className="car-card__button car-card__button--delete"
                onClick={() => onDelete(car.id)}
              >
                Удалить
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CarList;