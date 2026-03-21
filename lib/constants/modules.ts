/**
 * Códigos de módulos del sistema.
 * Deben coincidir con los registros en la tabla modules.
 */
export const MODULE_CODES = {
  DASHBOARD: "dashboard",
  PRODUCTOS: "productos",
  USUARIOS: "usuarios",
  EMPRESAS: "empresas",
} as const;

export type ModuleCode = (typeof MODULE_CODES)[keyof typeof MODULE_CODES];
