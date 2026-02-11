// src/components/CarMap/PreloadYandexMaps.tsx
import { useEffect } from 'react';

export const PreloadYandexMaps = () => {
  useEffect(() => {
    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
    if (!apiKey) return;

    // Создаем ссылку для предзагрузки
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${apiKey}`;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return null;
};