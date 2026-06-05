import api from './axiosConfig';

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  rol: 'ADMIN' | 'TECNICO' | 'CONDOMINO' | 'GUARDIA';
  activo: boolean;
  unidadId?: number;
  creadoEn?: string;
  ultimoAcceso?: string;
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await api.get<Usuario[]>('/api/admin/usuarios');
  return response.data;
};

export const getUsuario = async (id: number): Promise<Usuario> => {
  const response = await api.get<Usuario>(`/api/admin/usuarios/${id}`);
  return response.data;
};

export const createUsuario = async (usuario: Usuario): Promise<Usuario> => {
  const response = await api.post<Usuario>('/api/admin/usuarios', usuario);
  return response.data;
};

export const updateUsuario = async (id: number, usuario: Usuario): Promise<Usuario> => {
  const response = await api.put<Usuario>(`/api/admin/usuarios/${id}`, usuario);
  return response.data;
};

export const resetPassword = async (id: number, nuevaContrasena: string): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/api/admin/usuarios/${id}/reset-password`, { nuevaContrasena });
  return response.data;
};

export const cambiarContrasenaPropia = async (contrasenaActual: string, nuevaContrasena: string): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>('/api/usuarios/change-password', { contrasenaActual, nuevaContrasena });
  return response.data;
};
