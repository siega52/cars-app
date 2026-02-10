import axios from 'axios';
import type { Car, CarFormData } from '../types';

const API_URL = 'https://task.tspb.su/test-task/vehicles';

export const carApi = {
  async getAllCars(): Promise<Car[]> {
    const response = await axios.get<Car[]>(API_URL);
    return response.data;
  },

  async createCar(carData: CarFormData): Promise<Car> {
    const response = await axios.post<Car>(API_URL, carData);
    return response.data;
  },

  async updateCar(id: number, carData: Partial<CarFormData>): Promise<Car> {
    const response = await axios.put<Car>(`${API_URL}/${id}`, carData);
    return response.data;
  },

  async deleteCar(id: number): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  },
};