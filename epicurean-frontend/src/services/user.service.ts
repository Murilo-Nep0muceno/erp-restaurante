import api from './api';
import type { CreateUserInput, Role, UpdateUserInput, UserAccount } from '../types';

const createEndpointByRole: Record<Role, string> = {
  GERENTE: '/users',
  GARCOM: '/users/garcom',
  BALCONISTA: '/users/balconista',
  COZINHA: '/users/cozinha',
};

export async function getUsers(): Promise<UserAccount[]> {
  const { data } = await api.get<UserAccount[]>('/users');
  return data;
}

export async function createUser(role: Role, input: CreateUserInput): Promise<void> {
  await api.post(createEndpointByRole[role], input);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<void> {
  await api.put(`/users/${id}`, input);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
