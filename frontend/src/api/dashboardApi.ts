import api from './axiosConfig';

export interface ResumenMes {
  totalUnidades: number;
  lecturasCompletadas: number;
  lecturasPendientes: number;
  cobrosEmitidos: number;
  totalFacturado: number;
  progresoRecorrido: number;
}

export interface ConsumoHistorico {
  mes: string;
  consumoTotal: number;
  promedioPorUnidad: number;
}

export interface TopConsumidor {
  unidadNumero: string;
  propietario: string;
  consumo: number;
  monto: number;
}

export interface ProgresoRecorrido {
  unidadId: number;
  unidadNumero: string;
  propietario: string;
  lecturaAnterior: number;
  lecturaActual: number | null;
  consumo: number | null;
  monto: number | null;
  estado: 'COMPLETADA' | 'PENDIENTE' | 'ERROR';
}

export interface ConsumoUnidad {
  name: string;
  actual: number;
  anterior: number;
}

export interface EstadoCobrosMes {
  mes: string;
  pagados: number;
  emitidos: number;
  mora: number;
}

export interface Alerta {
  id: number;
  tipo: 'CONSUMO_ALTO' | 'LECTURA_PENDIENTE' | 'MORA';
  unidadNumero: string;
  propietario: string;
  descripcion: string;
  severidad: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const getResumenMes = async (): Promise<ResumenMes> => {
  const response = await api.get<ResumenMes>('/api/dashboard/resumen');
  return response.data;
};

export const getConsumoHistorico = async (): Promise<ConsumoHistorico[]> => {
  const response = await api.get<ConsumoHistorico[]>('/api/dashboard/consumo-historico');
  return response.data;
};

export const getTopConsumidores = async (): Promise<TopConsumidor[]> => {
  const response = await api.get<TopConsumidor[]>('/api/dashboard/top-consumidores');
  return response.data;
};

export const getProgresoRecorrido = async (): Promise<ProgresoRecorrido[]> => {
  const response = await api.get<ProgresoRecorrido[]>('/api/dashboard/progreso-recorrido');
  return response.data;
};

export const getAlertas = async (): Promise<Alerta[]> => {
  const response = await api.get<Alerta[]>('/api/dashboard/alertas');
  return response.data;
};

export const getConsumosUnidad = async (): Promise<ConsumoUnidad[]> => {
  const response = await api.get<ConsumoUnidad[]>('/api/dashboard/consumos-unidad');
  return response.data;
};

export const getEstadoCobros = async (): Promise<EstadoCobrosMes[]> => {
  const response = await api.get<EstadoCobrosMes[]>('/api/dashboard/estado-cobros');
  return response.data;
};
