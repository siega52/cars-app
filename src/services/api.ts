import axios from 'axios';
import type { Car, CarFormData } from '../types';

const API_URL = 'https://task.tspb.su/test-task/vehicles';

let localCars: Car[] = [];

export const carApi = {
  async getAllCars(): Promise<Car[]> {
    try {
      const response = await axios.get<Car[]>(API_URL);
      if (localCars.length === 0) {
        localCars = [...response.data];
      }
      return localCars.length > 0 ? localCars : response.data;
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  },

  async createCar(carData: CarFormData): Promise<Car> {
    try {
      const response = await axios.post<Car>(API_URL, carData).catch(() => null);
      
      if (response?.data) {
        localCars.push(response.data);
        return response.data;
      }
      
      const newCar: Car = {
        ...carData,
        id: Math.max(0, ...localCars.map(c => c.id)) + 1,
      };
      
      localCars.push(newCar);
      console.log('Car created (emulated):', newCar);
      return newCar;
    } catch (error) {
      console.error('Error creating car:', error);
      throw error;
    }
  },

  async updateCar(id: number, carData: Partial<CarFormData>): Promise<Car> {
    try {
      const response = await axios.put<Car>(`${API_URL}/${id}`, carData).catch(() => null);
      
      if (response?.data) {
        const index = localCars.findIndex(c => c.id === id);
        if (index !== -1) {
          localCars[index] = response.data;
        }
        return response.data;
      }
      
      const index = localCars.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Car not found');
      
      localCars[index] = { ...localCars[index], ...carData };
      console.log('Car updated (emulated):', localCars[index]);
      return localCars[index];
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  },

  async deleteCar(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/${id}`).catch(() => null);
      
      const index = localCars.findIndex(c => c.id === id);
      if (index !== -1) {
        localCars.splice(index, 1);
        console.log('Car deleted (emulated):', id);
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  },

  async resetCars(): Promise<Car[]> {
    const response = await axios.get<Car[]>(API_URL);
    localCars = [...response.data];
    return localCars;
  }
};