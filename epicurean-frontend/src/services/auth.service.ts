import api from './api';
import type { LoginResponse } from '../types';

export async function login(userName: string, passWord: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { userName, passWord });
  return data;
}
