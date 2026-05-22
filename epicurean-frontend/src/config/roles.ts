import type { Role } from '../types';

// Which roles may access each protected route.
export const ROUTE_ACCESS: Record<string, Role[]> = {
  '/balcao': ['BALCONISTA'],
  '/admin': ['GERENTE'],
  '/garcom': ['GARCOM'],
  '/cozinha': ['GERENTE', 'COZINHA'],
};

// Where to send a user right after login, based on their role.
// Each role owns a single panel (no cross-navigation between them).
export function landingForRole(role: Role): string {
  switch (role) {
    case 'GERENTE':
      return '/admin';
    case 'GARCOM':
      return '/garcom';
    case 'COZINHA':
      return '/cozinha';
    case 'BALCONISTA':
    default:
      return '/balcao';
  }
}

export const ROLE_LABEL: Record<Role, string> = {
  GERENTE: 'Gerente',
  BALCONISTA: 'Balconista',
  GARCOM: 'Garçom',
  COZINHA: 'Cozinha',
};
