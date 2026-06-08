import api from './axiosConfig';

export interface EspacioComun {
  id: number;
  nombre: string;
  descripcion?: string;
  capacidadMaxima?: number;
  costoReserva: number;
  activa: boolean;
}

export interface Reserva {
  id: number;
  espacioId: number;
  espacioNombre?: string;
  unidadId: number;
  unidadNumero?: string;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  estado: string; // PENDIENTE, APROBADA, RECHAZADA, CANCELADA
  creadoEn?: string;
}

export const getReservas = async (): Promise<Reserva[]> => {
  const response = await api.get<Reserva[]>('/api/reservas');
  return response.data;
};

export const getEspaciosActivos = async (): Promise<EspacioComun[]> => {
  const response = await api.get<EspacioComun[]>('/api/reservas/espacios');
  return response.data;
};

export const createReserva = async (data: Partial<Reserva>): Promise<Reserva> => {
  const response = await api.post<Reserva>('/api/reservas', data);
  return response.data;
};

export const updateEstadoReserva = async (id: number, estado: string): Promise<Reserva> => {
  const response = await api.put<Reserva>(`/api/reservas/${id}/estado?estado=${encodeURIComponent(estado)}`);
  return response.data;
};

export const getTodosLosEspacios = async (): Promise<EspacioComun[]> => {
  const response = await api.get<EspacioComun[]>('/api/reservas/espacios/all');
  return response.data;
};

export const crearEspacio = async (data: Omit<EspacioComun, 'id'>): Promise<EspacioComun> => {
  const response = await api.post<EspacioComun>('/api/reservas/espacios', data);
  return response.data;
};

export const actualizarEspacio = async (id: number, data: EspacioComun): Promise<EspacioComun> => {
  const response = await api.put<EspacioComun>(`/api/reservas/espacios/${id}`, data);
  return response.data;
};
