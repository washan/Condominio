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
  fotoUrl?: string | null;
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

export const updateLectura = async (id: number, valorM3: number, fotoUrl?: string): Promise<Lectura> => {
  const response = await api.put<Lectura>(`/api/lecturas/${id}?valorM3=${valorM3}${fotoUrl ? `&fotoUrl=${fotoUrl}` : ''}`);
  return response.data;
};

export const registrarLectura = async (unidadId: number, valorM3: number, fotoUrl?: string): Promise<Lectura> => {
  const response = await api.post<Lectura>(`/api/lecturas?unidadId=${unidadId}&valorM3=${valorM3}${fotoUrl ? `&fotoUrl=${fotoUrl}` : ''}`);
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

export interface PeriodoDto {
  id: number;
  anio: number;
  mes: number;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: 'ABIERTO' | 'CERRADO';
}

export const getPeriodos = async (): Promise<PeriodoDto[]> => {
  const response = await api.get<PeriodoDto[]>('/api/periodos');
  return response.data;
};

export const abrirPeriodo = async (anio: number, mes: number): Promise<PeriodoDto> => {
  const response = await api.post<PeriodoDto>(`/api/periodos?anio=${anio}&mes=${mes}`);
  return response.data;
};

export const cerrarPeriodo = async (id: number): Promise<PeriodoDto> => {
  const response = await api.post<PeriodoDto>(`/api/periodos/${id}/cerrar`);
  return response.data;
};

export const subirFotoLectura = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ url: string }>(
    '/api/lecturas/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data.url;
};

