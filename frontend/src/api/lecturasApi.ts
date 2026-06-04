import api from './axiosConfig';

export interface Lectura {
  id: number;
  unidadId: number;
  unidadNumero: string;
  propietario: string;
  lecturaAnterior: number;
  lecturaActual: number | null;
  consumo: number | null;
  fecha: string | null;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'ERROR';
  observaciones?: string;
}

export interface LecturaInicial {
  unidadId: number;
  lecturaInicial: number;
  fecha: string;
}

export const getLecturasPendientes = async (anio: number, mes: number): Promise<Lectura[]> => {
  const response = await api.get<Lectura[]>(`/api/lecturas?anio=${anio}&mes=${mes}`);
  return response.data;
};

export const getLectura = async (id: number): Promise<Lectura> => {
  const response = await api.get<Lectura>(`/api/lecturas/${id}`);
  return response.data;
};

export const updateLectura = async (id: number, data: Partial<Lectura>): Promise<Lectura> => {
  const response = await api.put<Lectura>(`/api/lecturas/${id}`, data);
  return response.data;
};

export const cargarLecturaInicial = async (data: LecturaInicial): Promise<void> => {
  await api.post('/api/lecturas/inicial', data);
};

export const importarLecturasCSV = async (file: File): Promise<{ importadas: number; errores: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ importadas: number; errores: number }>(
    '/api/lecturas/importar',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};
