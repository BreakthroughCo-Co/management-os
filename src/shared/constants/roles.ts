/**
 * Centralised RBAC role definitions.
 * Import ROLES and Role from this module wherever role checks or
 * filtering is needed to avoid duplicated string literals.
 */

export const ROLES = [
  "Admin",
  "Coordinator",
  "Practice Manager",
  "Practitioner",
  "Viewer",
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Returns true if the supplied role is in the allowed list.
 */
export function hasRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}

/**
 * Convenience sets for common permission levels.
 */
export const ADMIN_ONLY: readonly Role[] = ["Admin"] as const;
export const MANAGERS: readonly Role[] = ["Admin", "Coordinator", "Practice Manager"] as const;
export const CLINICAL_STAFF: readonly Role[] = ["Admin", "Coordinator", "Practitioner"] as const;
export const ALL_ROLES: readonly Role[] = ROLES;
