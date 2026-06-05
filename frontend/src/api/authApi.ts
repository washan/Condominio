import api from './axiosConfig';

export interface LoginResponse {
  token: string;
  user: {
    email: string;
    nombre: string;
    rol: 'ADMIN' | 'CONDOMINO' | 'GUARDIA';
  };
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<{
    accessToken: string;
    refreshToken: string;
    rol: 'ADMIN' | 'CONDOMINO' | 'GUARDIA';
    nombre: string;
    email: string;
  }>('/api/auth/login', { email, password });

  const data = response.data;
  return {
    token: data.accessToken,
    user: {
      email: data.email,
      nombre: data.nombre,
      rol: data.rol
    }
  };
};

export const refreshToken = async (token: string): Promise<{ token: string }> => {
  const response = await api.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken: token });
  return { token: response.data.accessToken };
};

export const logout = async (): Promise<void> => {
  await api.post('/api/auth/logout');
};
