import api from './axiosConfig';
import { Cobro } from './cobrosApi';

export interface CondominoPerfil {
  usuarioId: number;
  nombre: string;
  email: string;
  unidadId: number;
  unidadNumero: string;
  propietario: string;
  telefono: string | null;
}

export interface LecturaCondomino {
  lecturaAnterior: number;
  lecturaActual: number | null;
  consumoM3: number | null;
  fotoAnteriorUrl: string | null;
  fotoActualUrl: string | null;
}

export const getPerfilCondomino = async (): Promise<CondominoPerfil> => {
  const response = await api.get<CondominoPerfil>('/api/condomino/me');
  return response.data;
};

export const getCobroActualCondomino = async (): Promise<Cobro> => {
  const response = await api.get<Cobro>('/api/condomino/cobro-actual');
  return response.data;
};

export const getHistorialCondomino = async (): Promise<Cobro[]> => {
  const response = await api.get<Cobro[]>('/api/condomino/historial');
  return response.data;
};

export const getLecturaActualCondomino = async (): Promise<LecturaCondomino> => {
  const response = await api.get<LecturaCondomino>('/api/condomino/lectura-actual');
  return response.data;
};
