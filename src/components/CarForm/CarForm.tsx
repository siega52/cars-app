import React, { useState, useEffect } from 'react';
import type { Car, CarFormData } from '../../types';
import './CarForm.css';

interface CarFormProps {
  car?: Car | null;
  onSubmit: (carData: CarFormData) => void;
  onCancel: () => void;
}

const CarForm: React.FC<CarFormProps> = ({ car, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CarFormData>({
    name: '',
    model: '',
    year: new Date().getFullYear(),
    color: '#000000',
    price: 0,
    latitude: 55.753332,
    longitude: 37.621676,
  });

  useEffect(() => {
    if (car) {
      setFormData(car);
    }
  }, [car]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="car-form" onSubmit={handleSubmit}>
      <header className="car-form__header">
        <h2 className="car-form__title">
          {car ? 'Редактировать автомобиль' : 'Добавить новый автомобиль'}
        </h2>
      </header>

      <div className="car-form__fields">
        <div className="car-form__field">
          <label htmlFor="name" className="car-form__label">
            Марка:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="car-form__input"
            required
          />
        </div>

        <div className="car-form__field">
          <label htmlFor="model" className="car-form__label">
            Модель:
          </label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="car-form__input"
            required
          />
        </div>

        <div className="car-form__field">
          <label htmlFor="year" className="car-form__label">
            Год выпуска:
          </label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="car-form__input"
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>

        <div className="car-form__field">
          <label htmlFor="color" className="car-form__label">
            Цвет:
          </label>
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="car-form__input car-form__input--color"
            required
          />
        </div>

        <div className="car-form__field">
          <label htmlFor="price" className="car-form__label">
            Цена ($):
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="car-form__input"
            min="0"
            step="100"
            required
          />
        </div>

        <div className="car-form__field">
          <label htmlFor="latitude" className="car-form__label">
            Широта:
          </label>
          <input
            type="number"
            id="latitude"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            className="car-form__input"
            step="any"
            required
          />
        </div>

        <div className="car-form__field">
          <label htmlFor="longitude" className="car-form__label">
            Долгота:
          </label>
          <input
            type="number"
            id="longitude"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            className="car-form__input"
            step="any"
            required
          />
        </div>
      </div>

      <footer className="car-form__footer">
        <button type="submit" className="car-form__button car-form__button--submit">
          {car ? 'Сохранить' : 'Добавить'}
        </button>
        <button
          type="button"
          className="car-form__button car-form__button--cancel"
          onClick={onCancel}
        >
          Отмена
        </button>
      </footer>
    </form>
  );
};

export default CarForm;