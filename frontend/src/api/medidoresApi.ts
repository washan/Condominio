import api from './axiosConfig';

export interface Medidor {
  id?: number;
  unidadId: number;
  codigoInterno: string;
  activo: boolean;
  fechaInstalacion: string;
}

export const getMedidoresPorUnidad = async (unidadId: number): Promise<Medidor[]> => {
  const response = await api.get<Medidor[]>(`/api/medidores/unidad/${unidadId}`);
  return response.data;
};

export const createMedidor = async (data: Medidor): Promise<Medidor> => {
  const response = await api.post<Medidor>('/api/medidores', data);
  return response.data;
};

export const updateMedidor = async (id: number, data: Medidor): Promise<Medidor> => {
  const response = await api.put<Medidor>(`/api/medidores/${id}`, data);
  return response.data;
};
