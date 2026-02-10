import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Car } from '../../types';
import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
import './CarMap.css';

// // Fix for default icons in Leaflet
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

interface CarMapProps {
  cars: Car[];
}

const CarMap: React.FC<CarMapProps> = ({ cars }) => {
  const center: [number, number] = [55.753332, 37.621676];
  const zoom = 10;

  return (
    <section className="car-map">
      <header className="car-map__header">
        <h2 className="car-map__title">Карта расположения автомобилей</h2>
      </header>
      <div className="car-map__container">
        <MapContainer center={center} zoom={zoom} className="car-map__map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cars.map(car => (
            <Marker
              key={car.id}
              position={[car.latitude, car.longitude]}
            >
              <Popup>
                <div className="car-map__popup">
                  <h3 className="car-map__popup-title">
                    {car.name} {car.model}
                  </h3>
                  <p className="car-map__popup-text">Год: {car.year}</p>
                  <p className="car-map__popup-text">Цена: ${car.price.toLocaleString()}</p>
                  <p className="car-map__popup-text">Цвет: {car.color}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
};

export default CarMap;