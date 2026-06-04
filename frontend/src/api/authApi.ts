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
  const response = await api.post<LoginResponse>('/api/auth/login', { email, password });
  return response.data;
};

export const refreshToken = async (token: string): Promise<{ token: string }> => {
  const response = await api.post<{ token: string }>('/api/auth/refresh', { token });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/api/auth/logout');
};
