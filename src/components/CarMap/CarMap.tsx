import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Car } from '../../types';
import './CarMap.css';

declare global {
  interface Window {
    ymaps: any;
    _yandexMapsLoading: boolean;
    _yandexMapsPromise: Promise<void> | null;
  }
}

interface CarMapProps {
  cars: Car[];
}

// Глобальная загрузка API (загружается один раз)
const loadYandexMapsAPI = (apiKey: string): Promise<void> => {
  // Если уже загружено
  if (window.ymaps) {
    return Promise.resolve();
  }

  // Если уже загружается
  if (window._yandexMapsPromise) {
    return window._yandexMapsPromise;
  }

  window._yandexMapsPromise = new Promise((resolve, reject) => {
    // Проверяем, не загружается ли уже
    if (window._yandexMapsLoading) {
      // Ждем завершения
      const checkInterval = setInterval(() => {
        if (window.ymaps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    window._yandexMapsLoading = true;

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${apiKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      window.ymaps.ready(() => {
        window._yandexMapsLoading = false;
        resolve();
      });
    };
    
    script.onerror = () => {
      window._yandexMapsLoading = false;
      window._yandexMapsPromise = null;
      reject(new Error('Не удалось загрузить Яндекс.Карты'));
    };
    
    // Проверяем, нет ли уже такого скрипта
    const existingScript = document.querySelector(`script[src*="api-maps.yandex.ru"]`);
    if (!existingScript) {
      document.head.appendChild(script);
    } else {
      // Если скрипт уже есть, ждем его загрузки
      script.onload?.();
    }
  });

  return window._yandexMapsPromise;
};

const CarMap: React.FC<CarMapProps> = ({ cars }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const geoObjectsRef = useRef<any[]>([]); // Храним геообъекты отдельно

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

  // Мемоизируем данные для меток
  const placemarksData = useMemo(() => 
    cars.map(car => ({
      id: car.id,
      coordinates: [car.latitude, car.longitude] as [number, number],
      properties: {
        balloonContentHeader: `${car.name} ${car.model}`,
        balloonContentBody: `
          <div class="car-map__balloon">
            <p><strong>Год:</strong> ${car.year}</p>
            <p><strong>Цена:</strong> $${car.price.toLocaleString()}</p>
            <p><strong>Цвет:</strong> <span style="color: ${car.color}">${car.color}</span></p>
            <p><small>ID: ${car.id}</small></p>
          </div>
        `,
        hintContent: `${car.name} ${car.model} (${car.year})`
      },
      options: {
        preset: 'islands#circleIcon',
        iconColor: car.color || '#ff0000'
      }
    })),
    [cars]
  );

  // Предварительный расчет центра карты
  const mapCenter = useMemo(() => {
    if (cars.length === 0) return [55.753332, 37.621676] as [number, number];
    
    const sumLat = cars.reduce((sum, car) => sum + car.latitude, 0);
    const sumLng = cars.reduce((sum, car) => sum + car.longitude, 0);
    return [sumLat / cars.length, sumLng / cars.length] as [number, number];
  }, [cars]);

  // Инициализация карты
  const initMap = useCallback(() => {
    if (!mapContainerRef.current || !window.ymaps) {
      console.error('Map container or ymaps not available');
      return;
    }

    try {
      setProgress(30);
      
      // Уничтожаем предыдущую карту если есть
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying previous map:', e);
        }
        mapRef.current = null;
      }

      // Создаем новую карту
      mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
        center: mapCenter,
        zoom: 10,
        controls: ['zoomControl', 'fullscreenControl'],
        behaviors: ['default', 'scrollZoom']
      });

      setProgress(60);

      // Создаем массив для геообъектов
      geoObjectsRef.current = [];
      
      // Создаем метки
      placemarksData.forEach(data => {
        const placemark = new window.ymaps.Placemark(
          data.coordinates,
          data.properties,
          data.options
        );
        geoObjectsRef.current.push(placemark);
      });

      setProgress(80);

      // Добавляем все объекты на карту
      if (geoObjectsRef.current.length > 0) {
        // Используем кластеризацию только при большом количестве меток
        if (geoObjectsRef.current.length > 15) {
          const clusterer = new window.ymaps.Clusterer({
            preset: 'islands#invertedDarkBlueClusterIcons',
            groupByCoordinates: false,
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
          });
          
          clusterer.add(geoObjectsRef.current);
          mapRef.current.geoObjects.add(clusterer);
        } else {
          // Просто добавляем метки
          geoObjectsRef.current.forEach(geoObject => {
            mapRef.current.geoObjects.add(geoObject);
          });
        }
      }

      setProgress(100);
      setTimeout(() => setIsLoading(false), 300); // Задержка для плавности

    } catch (err) {
      console.error('Ошибка инициализации карты:', err);
      setError('Ошибка при создании карты: ' + (err as Error).message);
      setIsLoading(false);
    }
  }, [mapCenter, placemarksData]);

  // Эффект загрузки
  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) {
      setIsLoading(false);
      setError('API ключ не указан');
      return;
    }

    let mounted = true;
    let loadTimeout: NodeJS.Timeout;

    const loadMap = async () => {
      try {
        setProgress(10);
        
        // Загружаем API
        await loadYandexMapsAPI(apiKey);
        
        if (!mounted) return;
        
        setProgress(20);
        
        // Ждем готовности ymaps
        if (!window.ymaps) {
          throw new Error('API Яндекс.Карт не загрузилось');
        }

        // Инициализируем карту
        window.ymaps.ready(() => {
          if (!mounted) return;
          initMap();
        });

      } catch (err) {
        if (!mounted) return;
        console.error('Ошибка загрузки карты:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки Яндекс.Карт');
        setIsLoading(false);
      }
    };

    // Загружаем карту с небольшой задержкой для предотвращения гонки
    loadTimeout = setTimeout(loadMap, 100);

    // Очистка
    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
      
      // Очищаем карту при размонтировании
      if (mapRef.current) {
        try {
          // Удаляем все геообъекты
          if (geoObjectsRef.current.length > 0) {
            geoObjectsRef.current.forEach(geoObject => {
              try {
                mapRef.current?.geoObjects?.remove(geoObject);
              } catch (e) {
                // Игнорируем ошибки удаления
              }
            });
            geoObjectsRef.current = [];
          }
          
          // Уничтожаем карту
          mapRef.current.destroy();
          mapRef.current = null;
        } catch (e) {
          console.warn('Error cleaning up map:', e);
        }
      }
    };
  }, [apiKey, initMap]);

  // Если нет API ключа - показываем демо
  if (!apiKey) {
    return <DemoMap cars={cars} />;
  }

  // Функция для центрирования карты
  const handleCenterMap = () => {
    if (mapRef.current) {
      mapRef.current.setCenter(mapCenter, 10);
    }
  };

  // Функция для показа всех автомобилей
  const handleShowAll = () => {
    if (mapRef.current && placemarksData.length > 0) {
      try {
        // Собираем координаты всех меток
        const coordinates = placemarksData.map(data => data.coordinates);
        
        // Создаем bounds
        const bounds = window.ymaps.util.bounds.fromPoints(coordinates);
        mapRef.current.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: [50, 50, 50, 50]
        });
      } catch (err) {
        console.error('Error showing all markers:', err);
      }
    }
  };

  return (
    <section className="car-map">
      <header className="car-map__header">
        <h2 className="car-map__title">Карта расположения автомобилей</h2>
        <p className="car-map__subtitle">
          <span className="car-map__provider">Яндекс.Карты</span>
          <span className="car-map__count">{cars.length} автомобилей</span>
        </p>
      </header>
      
      <div className="car-map__container">
        {isLoading && (
          <div className="car-map__loading">
            <div className="car-map__spinner"></div>
            <div className="car-map__loading-progress">
              <div 
                className="car-map__loading-bar" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="car-map__loading-text">
              {progress < 50 ? 'Загрузка карты...' : 'Инициализация...'} {progress}%
            </p>
          </div>
        )}
        
        {error && (
          <div className="car-map__error">
            <div className="car-map__error-icon">⚠️</div>
            <h3>Ошибка загрузки карты</h3>
            <p>{error}</p>
            <button 
              className="car-map__retry-button"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setProgress(0);
                setTimeout(() => window.location.reload(), 100);
              }}
            >
              Попробовать снова
            </button>
          </div>
        )}
        
        <div 
          ref={mapContainerRef} 
          className="car-map__map"
          style={{ 
            height: '400px',
            opacity: isLoading ? 0.7 : 1,
            transition: 'opacity 0.3s ease'
          }}
        />
      </div>

      {!isLoading && !error && (
        <div className="car-map__controls">
          <button 
            className="car-map__control-button car-map__control-button--center"
            onClick={handleCenterMap}
            title="Центрировать карту"
          >
            <span className="car-map__control-icon"></span>
            Центрировать
          </button>
          <button 
            className="car-map__control-button car-map__control-button--show-all"
            onClick={handleShowAll}
            title="Показать все автомобили"
            disabled={placemarksData.length === 0}
          >
            <span className="car-map__control-icon"></span>
            Показать все
          </button>
          <div className="car-map__stats">
            <span className="car-map__stat">
              <span className="car-map__stat-icon"></span>
              {placemarksData.length} меток
            </span>
            {placemarksData.length > 15 && (
              <span className="car-map__stat car-map__stat--clustered">
                <span className="car-map__stat-icon"></span>
                Кластеризация включена
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

// Демо-компонент для случая без API ключа
const DemoMap: React.FC<{ cars: Car[] }> = ({ cars }) => (
  <section className="car-map car-map--demo">
    <header className="car-map__header">
      <h2 className="car-map__title">Карта расположения автомобилей</h2>
      <p className="car-map__subtitle">Для работы требуется API ключ Яндекс.Карт</p>
    </header>
    
    <div className="car-map__demo-container">
      <div className="car-map__demo-grid">
        {cars.slice(0, 8).map(car => (
          <div key={car.id} className="car-map__demo-card">
            <div 
              className="car-map__demo-marker" 
              style={{ backgroundColor: car.color || '#ff0000' }}
            />
            <div className="car-map__demo-content">
              <h3>{car.name} {car.model}</h3>
              <p>Координаты: {car.latitude.toFixed(4)}, {car.longitude.toFixed(4)}</p>
              <p>Год: {car.year} • Цена: ${car.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="car-map__demo-instructions">
        <h4>Как подключить Яндекс.Карты:</h4>
        <ol>
          <li>Получите бесплатный API ключ на <a href="https://developer.tech.yandex.ru/" target="_blank" rel="noopener noreferrer">developer.tech.yandex.ru</a></li>
          <li>Создайте файл <code>.env</code> в корне проекта</li>
          <li>Добавьте строку: <code>VITE_YANDEX_MAPS_API_KEY=ваш_ключ</code></li>
          <li>Перезапустите приложение: <code>npm run dev</code></li>
        </ol>
        <p className="car-map__demo-note">
          Для тестирования можно использовать демо-ключ (есть ограничения)
        </p>
      </div>
    </div>
  </section>
);

export default CarMap;