import api from './axiosConfig';

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  fechaPublicacion?: string;
  vigenteHasta?: string;
  creadoPorNombre?: string;
}

export const getAvisosVigentes = async (): Promise<Aviso[]> => {
  const response = await api.get<Aviso[]>('/api/avisos');
  return response.data;
};

export const getAllAvisos = async (): Promise<Aviso[]> => {
  const response = await api.get<Aviso[]>('/api/avisos/todos');
  return response.data;
};

export const createAviso = async (data: Partial<Aviso>): Promise<Aviso> => {
  const response = await api.post<Aviso>('/api/avisos', data);
  return response.data;
};

export const updateAviso = async (id: number, data: Partial<Aviso>): Promise<Aviso> => {
  const response = await api.put<Aviso>(`/api/avisos/${id}`, data);
  return response.data;
};

export const deleteAviso = async (id: number): Promise<void> => {
  await api.delete(`/api/avisos/${id}`);
};
