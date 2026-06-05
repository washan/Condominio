import api from './axiosConfig';

export interface AjusteSaldo {
  id?: number;
  unidadId: number;
  monto: number; // positive = credit, negative = debt
  descripcion: string;
  fechaEfectiva: string; // YYYY-MM-DD
  creadoPorNombre?: string;
  creadoEn?: string;
}

export const getAjustesPorUnidad = async (unidadId: number): Promise<AjusteSaldo[]> => {
  const response = await api.get<AjusteSaldo[]>(`/api/ajustes/unidad/${unidadId}`);
  return response.data;
};

export const createAjuste = async (ajuste: AjusteSaldo): Promise<AjusteSaldo> => {
  const response = await api.post<AjusteSaldo>('/api/ajustes', ajuste);
  return response.data;
};

export const importarAjustesCSV = async (file: File): Promise<{ importados: number; errores: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ importados: number; errores: number }>(
    '/api/ajustes/importar',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};
