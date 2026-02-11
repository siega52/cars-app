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

const loadYandexMapsAPI = (apiKey: string): Promise<void> => {
  if (window.ymaps) {
    return Promise.resolve();
  }

  if (window._yandexMapsPromise) {
    return window._yandexMapsPromise;
  }

  window._yandexMapsPromise = new Promise((resolve, reject) => {
    if (window._yandexMapsLoading) {
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
    
    const existingScript = document.querySelector(`script[src*="api-maps.yandex.ru"]`);
    if (!existingScript) {
      document.head.appendChild(script);
    } else {
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
  const geoObjectsRef = useRef<any[]>([]);

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

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

  const mapCenter = useMemo(() => {
    if (cars.length === 0) return [55.753332, 37.621676] as [number, number];
    
    const sumLat = cars.reduce((sum, car) => sum + car.latitude, 0);
    const sumLng = cars.reduce((sum, car) => sum + car.longitude, 0);
    return [sumLat / cars.length, sumLng / cars.length] as [number, number];
  }, [cars]);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || !window.ymaps) {
      console.error('Map container or ymaps not available');
      return;
    }

    try {
      setProgress(30);
      
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying previous map:', e);
        }
        mapRef.current = null;
      }

      mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
        center: mapCenter,
        zoom: 10,
        controls: ['zoomControl', 'fullscreenControl'],
        behaviors: ['default', 'scrollZoom']
      });

      setProgress(60);

      geoObjectsRef.current = [];
      
      placemarksData.forEach(data => {
        const placemark = new window.ymaps.Placemark(
          data.coordinates,
          data.properties,
          data.options
        );
        geoObjectsRef.current.push(placemark);
      });

      setProgress(80);

      if (geoObjectsRef.current.length > 0) {
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
        
        await loadYandexMapsAPI(apiKey);
        
        if (!mounted) return;
        
        setProgress(20);
        
        if (!window.ymaps) {
          throw new Error('API Яндекс.Карт не загрузилось');
        }

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

    loadTimeout = setTimeout(loadMap, 100);

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
      
      if (mapRef.current) {
        try {
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
          
          mapRef.current.destroy();
          mapRef.current = null;
        } catch (e) {
          console.warn('Error cleaning up map:', e);
        }
      }
    };
  }, [apiKey, initMap]);

  const handleCenterMap = () => {
    if (mapRef.current) {
      mapRef.current.setCenter(mapCenter, 10);
    }
  };

  const handleShowAll = () => {
    if (mapRef.current && placemarksData.length > 0) {
      try {
        const coordinates = placemarksData.map(data => data.coordinates);
        
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

export default CarMap;