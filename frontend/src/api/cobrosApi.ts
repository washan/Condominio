import api from './axiosConfig';

export interface ItemCobro {
  id?: number;
  rubroId: number | null;
  rubroNombre: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Cobro {
  id: number;
  unidadId: number;
  unidadNumero: string;
  propietario: string;
  periodoId: number;
  periodoMes: number;
  periodoAnio: number;
  saldoMonetarioAnterior: number;
  totalCobros: number;
  totalPagar: number;
  estado: 'BORRADOR' | 'EMITIDO' | 'PAGADO' | 'MORA';
  items: ItemCobro[];
}

export const getCobros = async (periodoId: number): Promise<Cobro[]> => {
  const response = await api.get<Cobro[]>(`/api/cobros/periodo/${periodoId}`);
  return response.data;
};

export const getCobro = async (id: number): Promise<Cobro> => {
  const response = await api.get<Cobro>(`/api/cobros/${id}`);
  return response.data;
};

export const generarCobros = async (periodoId: number): Promise<Cobro[]> => {
  const response = await api.post<Cobro[]>(`/api/periodos/${periodoId}/generar-cobros`);
  return response.data;
};

export const emitirCobros = async (periodoId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/api/periodos/${periodoId}/emitir-cobros`);
  return response.data;
};

export const pagarCobro = async (id: number): Promise<Cobro> => {
  const response = await api.post<Cobro>(`/api/cobros/${id}/pagar`);
  return response.data;
};

export const descargarPdf = async (cobroId: number): Promise<Blob> => {
  const response = await api.get(`/api/cobros/${cobroId}/pdf`, { responseType: 'blob' });
  return response.data;
};

export const descargarPdfMasivo = async (periodoId: number): Promise<Blob> => {
  const response = await api.post(`/api/periodos/${periodoId}/pdf-masivo`, null, { responseType: 'blob' });
  return response.data;
};

export const enviarEmailCobro = async (cobroId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/api/cobros/${cobroId}/enviar-email`);
  return response.data;
};
