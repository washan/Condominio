import api from './axiosConfig';

export interface Invitado {
  id: number;
  unidadId: number;
  unidadNumero?: string;
  nombre: string;
  identificacion?: string;
  placaVehiculo?: string;
  fechaHoraDesde: string;
  fechaHoraHasta: string;
  estado: string; // PENDIENTE, INGRESADO, SALIDO, CANCELADO
  creadoEn?: string;
}

export const getInvitadosVigentes = async (): Promise<Invitado[]> => {
  const response = await api.get<Invitado[]>('/api/invitados');
  return response.data;
};

export const searchInvitados = async (q: string): Promise<Invitado[]> => {
  const response = await api.get<Invitado[]>(`/api/invitados/search?q=${encodeURIComponent(q)}`);
  return response.data;
};

export const getInvitadosPorUnidad = async (unidadId: number): Promise<Invitado[]> => {
  const response = await api.get<Invitado[]>(`/api/invitados/unidad/${unidadId}`);
  return response.data;
};

export const getMisInvitados = async (): Promise<Invitado[]> => {
  const response = await api.get<Invitado[]>('/api/invitados/mis-invitados');
  return response.data;
};

export const createInvitado = async (data: Partial<Invitado>): Promise<Invitado> => {
  const response = await api.post<Invitado>('/api/invitados', data);
  return response.data;
};

export const updateEstadoInvitado = async (id: number, estado: string): Promise<Invitado> => {
  const response = await api.put<Invitado>(`/api/invitados/${id}/estado?estado=${encodeURIComponent(estado)}`);
  return response.data;
};
