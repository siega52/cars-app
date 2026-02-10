import React, { useEffect, useRef, useState } from 'react';
import type { Car } from '../../types';
import './CarMap.css';

declare global {
  interface Window {
    ymaps: any;
  }
}

interface CarMapProps {
  cars: Car[];
}

const CarMap: React.FC<CarMapProps> = ({ cars }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) return;

    const loadYandexMaps = () => {
      // Проверяем, не загружены ли карты уже
      if (window.ymaps) {
        initMap();
        return;
      }

      // Загружаем API Яндекс.Карт
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${apiKey}`;
      script.async = true;
      
      script.onload = () => {
        window.ymaps.ready(initMap);
      };
      
      script.onerror = () => {
        setError('Не удалось загрузить Яндекс.Карты');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    const initMap = () => {
      try {
        window.ymaps.ready(() => {
          if (!mapContainerRef.current) return;

          // Создаем карту
          mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
            center: [55.753332, 37.621676],
            zoom: 10,
            controls: ['zoomControl', 'fullscreenControl']
          });

          // Добавляем метки
          cars.forEach(car => {
            const placemark = new window.ymaps.Placemark(
              [car.latitude, car.longitude],
              {
                balloonContentHeader: `${car.name} ${car.model}`,
                balloonContentBody: `
                  <div class="car-map__balloon">
                    <p><strong>Год:</strong> ${car.year}</p>
                    <p><strong>Цена:</strong> $${car.price.toLocaleString()}</p>
                    <p><strong>Цвет:</strong> <span style="color: ${car.color}">${car.color}</span></p>
                    <p><strong>Координаты:</strong><br/>
                      ${car.latitude.toFixed(6)}, ${car.longitude.toFixed(6)}
                    </p>
                  </div>
                `,
                hintContent: `${car.name} ${car.model}`
              },
              {
                preset: 'islands#circleIcon',
                iconColor: car.color || '#ff0000'
              }
            );

            placemark.events.add('click', () => {
              setSelectedCar(car);
            });

            mapRef.current.geoObjects.add(placemark);
          });

          // Добавляем кластеризатор
          const clusterer = new window.ymaps.Clusterer({
            preset: 'islands#invertedDarkBlueClusterIcons',
            groupByCoordinates: false,
            clusterDisableClickZoom: true,
            clusterHideIconOnBalloonOpen: false,
          });

          // Получаем все геообъекты и добавляем в кластеризатор
          const geoObjects = mapRef.current.geoObjects.toArray();
          mapRef.current.geoObjects.removeAll();
          clusterer.add(geoObjects);
          mapRef.current.geoObjects.add(clusterer);

          setIsLoading(false);
        });
      } catch (err) {
        setError('Ошибка при инициализации карты');
        setIsLoading(false);
        console.error(err);
      }
    };

    loadYandexMaps();

    // Очистка при размонтировании
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, [apiKey, cars]);

  if (!apiKey) {
    return (
      <section className="car-map car-map--demo">
        <header className="car-map__header">
          <h2 className="car-map__title">Карта расположения автомобилей (Яндекс.Карты)</h2>
          <p className="car-map__subtitle">Для работы карты требуется API ключ Яндекс.Карт</p>
        </header>
        
        <div className="car-map__demo-container">
          <div className="car-map__demo-map">
            <div className="car-map__demo-content">
              <h3>Демонстрация карты</h3>
              <p>Координаты {cars.length} автомобилей:</p>
              <ul className="car-map__demo-list">
                {cars.slice(0, 5).map(car => (
                  <li key={car.id} className="car-map__demo-item">
                    {car.name} {car.model}: {car.latitude.toFixed(4)}, {car.longitude.toFixed(4)}
                  </li>
                ))}
                {cars.length > 5 && (
                  <li className="car-map__demo-item">
                    ... и еще {cars.length - 5} автомобилей
                  </li>
                )}
              </ul>
              <div className="car-map__demo-instructions">
                <p><strong>Для подключения Яндекс.Карт:</strong></p>
                <ol>
                  <li>Получите бесплатный API ключ на <a href="https://developer.tech.yandex.ru/" target="_blank" rel="noreferrer">developer.tech.yandex.ru</a></li>
                  <li>Создайте файл .env в корне проекта</li>
                  <li>Добавьте: VITE_YANDEX_MAPS_API_KEY=ваш_ключ</li>
                  <li>Перезапустите приложение</li>
                </ol>
                <p className="car-map__demo-note">
                  <small>Для тестирования можно использовать демо-ключ (ограниченный)</small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="car-map">
        <div className="car-map__error">
          <h3>Ошибка загрузки карты</h3>
          <p>{error}</p>
          <button 
            className="car-map__retry-button"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="car-map">
      <header className="car-map__header">
        <h2 className="car-map__title">Карта расположения автомобилей (Яндекс.Карты)</h2>
        <p className="car-map__subtitle">
          Количество автомобилей на карте: {cars.length}
          {selectedCar && ` • Выбран: ${selectedCar.name} ${selectedCar.model}`}
        </p>
      </header>
      
      <div className="car-map__container">
        {isLoading && (
          <div className="car-map__loading-overlay">
            <div className="car-map__loading-spinner"></div>
            <p>Загрузка Яндекс.Карт...</p>
          </div>
        )}
        <div 
          ref={mapContainerRef} 
          className="car-map__map"
          style={{ height: '400px' }}
        />
      </div>

      <div className="car-map__controls">
        <button 
          className="car-map__control-button"
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setCenter([55.753332, 37.621676], 10);
            }
          }}
        >
          Сбросить вид
        </button>
        <button 
          className="car-map__control-button"
          onClick={() => {
            if (mapRef.current && cars.length > 0) {
              const bounds = mapRef.current.geoObjects.getBounds();
              if (bounds) {
                mapRef.current.setBounds(bounds, { checkZoomRange: true });
              }
            }
          }}
        >
          Показать все автомобили
        </button>
      </div>

      <div className="car-map__legend">
        <h3 className="car-map__legend-title">Легенда:</h3>
        <ul className="car-map__legend-list">
          <li className="car-map__legend-item">
            <span className="car-map__legend-marker" style={{ backgroundColor: '#ff0000' }}></span>
            Автомобили на карте (цвет соответствует цвету автомобиля)
          </li>
          <li className="car-map__legend-item">
            <span className="car-map__legend-cluster"></span>
            Группа автомобилей
          </li>
          <li className="car-map__legend-item">
            <span className="car-map__legend-text">Используются Яндекс.Карты</span>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default CarMap;