import React, { useState, useEffect, useCallback } from 'react';
import type { Car, SortField, SortDirection, CarFormData } from './types';
import { carApi } from './services/api';
import CarList from './components/CarList/CarList';
import CarForm from './components/CarForm/CarForm';
import SortControls from './components/SortControls/SortControls';
import CarMap from './components/CarMap/CarMap';
import './App.css';

const App: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchCars = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await carApi.getAllCars();
      setCars(data);
      setFilteredCars(data);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    const sortedCars = [...cars];

    if (sortField !== 'none') {
      sortedCars.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    setFilteredCars(sortedCars);
  }, [cars, sortField, sortDirection]);

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleCreateCar = async (carData: CarFormData) => {
    try {
      await carApi.createCar(carData);
      await fetchCars();
      setIsFormVisible(false);
    } catch (err) {
      setError('Ошибка при создании автомобиля');
      console.error(err);
    }
  };

  const handleUpdateCar = async (carData: CarFormData) => {
    if (!editingCar) return;

    try {
      await carApi.updateCar(editingCar.id, carData);
      await fetchCars();
      setEditingCar(null);
      setIsFormVisible(false);
    } catch (err) {
      setError('Ошибка при обновлении автомобиля');
      console.error(err);
    }
  };

  const handleDeleteCar = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот автомобиль?')) {
      try {
        await carApi.deleteCar(id);
        await fetchCars();
      } catch (err) {
        setError('Ошибка при удалении автомобиля');
        console.error(err);
      }
    }
  };

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
    setIsFormVisible(true);
  };

  const handleFormSubmit = (carData: CarFormData) => {
    if (editingCar) {
      handleUpdateCar(carData);
    } else {
      handleCreateCar(carData);
    }
  };

  const handleCancelForm = () => {
    setEditingCar(null);
    setIsFormVisible(false);
  };

  if (isLoading) {
    return <div className="app__loading">Загрузка...</div>;
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Управление автомобилями</h1>
      </header>

      <main className="app__main">
        {error && (
          <div className="app__error">
            {error}
            <button className="app__error-close" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        <section className="app__controls">
          <SortControls
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
          <button
            className="app__add-button"
            onClick={() => setIsFormVisible(true)}
          >
            Добавить автомобиль
          </button>
        </section>

        {isFormVisible && (
          <section className="app__form-section">
            <CarForm
              car={editingCar}
              onSubmit={handleFormSubmit}
              onCancel={handleCancelForm}
            />
          </section>
        )}

        <CarList
          cars={filteredCars}
          onEdit={handleEditCar}
          onDelete={handleDeleteCar}
        />

        <CarMap cars={filteredCars} />
      </main>

      <footer className="app__footer">
        <p className="app__footer-text">
          Всего автомобилей в базе: {cars.length}
        </p>
      </footer>
    </div>
  );
};

export default App;