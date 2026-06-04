import api from './axiosConfig';

export interface Cobro {
  id: number;
  periodoId: number;
  unidadId: number;
  unidadNumero: string;
  propietario: string;
  saldoAnterior: number;
  montoAgua: number;
  otrosRubros: number;
  total: number;
  estado: 'EMITIDO' | 'PAGADO' | 'MORA';
  fechaEmision: string;
  fechaPago?: string;
}

export const getCobros = async (periodoId: number): Promise<Cobro[]> => {
  const response = await api.get<Cobro[]>(`/api/cobros?periodoId=${periodoId}`);
  return response.data;
};

export const getCobro = async (id: number): Promise<Cobro> => {
  const response = await api.get<Cobro>(`/api/cobros/${id}`);
  return response.data;
};

export const generarCobros = async (periodoId: number): Promise<{ generados: number }> => {
  const response = await api.post<{ generados: number }>(`/api/cobros/generar/${periodoId}`);
  return response.data;
};

export const descargarPdf = async (cobroId: number): Promise<Blob> => {
  const response = await api.get(`/api/cobros/${cobroId}/pdf`, { responseType: 'blob' });
  return response.data;
};

export const descargarPdfMasivo = async (periodoId: number): Promise<Blob> => {
  const response = await api.get(`/api/cobros/pdf-masivo/${periodoId}`, { responseType: 'blob' });
  return response.data;
};
