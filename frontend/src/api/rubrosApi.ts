import api from './axiosConfig';

export interface Rubro {
  id?: number;
  nombre: string;
  descripcion?: string;
  tipo: 'CONSUMO' | 'FIJO' | 'VARIABLE' | 'PORCENTAJE';
  ordenDisplay: number;
  activo: boolean;
  porcentajeMora: number;
}

export interface TarifaRubro {
  id?: number;
  rubroId: number;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin?: string; // YYYY-MM-DD
  configJson: string; // JSON configuration string
  creadoPorNombre?: string;
  creadoEn?: string;
}

export const getRubros = async (soloActivos = false): Promise<Rubro[]> => {
  const response = await api.get<Rubro[]>('/api/rubros', { params: { soloActivos } });
  return response.data;
};

export const getRubro = async (id: number): Promise<Rubro> => {
  const response = await api.get<Rubro>(`/api/rubros/${id}`);
  return response.data;
};

export const createRubro = async (rubro: Rubro): Promise<Rubro> => {
  const response = await api.post<Rubro>('/api/rubros', rubro);
  return response.data;
};

export const updateRubro = async (id: number, rubro: Rubro): Promise<Rubro> => {
  const response = await api.put<Rubro>(`/api/rubros/${id}`, rubro);
  return response.data;
};

export const deleteRubro = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/api/rubros/${id}`);
  return response.data;
};

export const getTarifaVigente = async (rubroId: number, fecha?: string): Promise<TarifaRubro> => {
  const response = await api.get<TarifaRubro>(`/api/tarifas/${rubroId}/vigente`, { params: { fecha } });
  return response.data;
};

export const getHistorialTarifas = async (rubroId: number): Promise<TarifaRubro[]> => {
  const response = await api.get<TarifaRubro[]>(`/api/tarifas/${rubroId}/historial`);
  return response.data;
};

export const createTarifa = async (rubroId: number, tarifa: TarifaRubro): Promise<TarifaRubro> => {
  const response = await api.post<TarifaRubro>(`/api/tarifas/${rubroId}`, tarifa);
  return response.data;
};
