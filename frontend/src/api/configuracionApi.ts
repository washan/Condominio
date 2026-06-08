import api from './axiosConfig';

export interface Configuracion {
  nombreCondominio: string;
  telefonoContacto: string;
  emailContacto: string;
  direccion: string;
  logoUrl?: string;
}

export const getConfiguracion = async (): Promise<Configuracion> => {
  const response = await api.get<Configuracion>('/api/configuracion');
  return response.data;
};

export const updateConfiguracion = async (params: Partial<Configuracion>): Promise<Configuracion> => {
  const response = await api.put<Configuracion>('/api/configuracion', params);
  return response.data;
};

export const uploadLogo = async (file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await api.post<{ logoUrl: string }>(
    '/api/configuracion/logo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};
