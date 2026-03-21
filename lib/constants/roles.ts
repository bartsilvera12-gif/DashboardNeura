/**
 * Códigos de roles del sistema.
 * Deben coincidir con los registros en la tabla roles.
 */
export const ROLE_CODES = {
  SUPER_ADMIN: "super_admin",
  COMPANY_ADMIN: "company_admin",
  VENDEDOR: "vendedor",
  OPERADOR: "operador",
  DEPOSITO: "deposito",
  SUPERVISOR: "supervisor",
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
