import api from './axiosConfig';

export interface Unidad {
  id: number;
  numero: string;
  propietario: string;
  email: string;
  telefono: string;
  activo: boolean;
}

export const getUnidades = async (): Promise<Unidad[]> => {
  const response = await api.get<Unidad[]>('/api/unidades');
  return response.data;
};

export const getUnidad = async (id: number): Promise<Unidad> => {
  const response = await api.get<Unidad>(`/api/unidades/${id}`);
  return response.data;
};

export const createUnidad = async (data: Partial<Unidad>): Promise<Unidad> => {
  const response = await api.post<Unidad>('/api/unidades', data);
  return response.data;
};

export const updateUnidad = async (id: number, data: Partial<Unidad>): Promise<Unidad> => {
  const response = await api.put<Unidad>(`/api/unidades/${id}`, data);
  return response.data;
};
