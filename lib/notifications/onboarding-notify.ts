/**
 * Notificación al admin creado en onboarding.
 * Estructura preparada para futuro proveedor (email, etc.).
 * Por ahora no envía nada; solo define el contrato.
 */

export interface OnboardingNotifyPayload {
  adminEmail: string;
  adminName: string;
  companyName: string;
  companySlug: string;
  /** Futuro: link para establecer contraseña o recordatorio */
  resetPasswordLink?: string;
}

/**
 * Notifica al admin principal que su cuenta fue creada.
 * Futuro: integrar con Resend, SendGrid, etc.
 */
export async function notifyAdminCreated(
  payload: OnboardingNotifyPayload
): Promise<{ ok: boolean; error?: string }> {
  // TODO: Integrar con proveedor de email
  // Por ahora solo log (no exponer contraseña en logs)
  if (process.env.NODE_ENV === "development") {
    console.info(
      "[onboarding] Admin creado:",
      payload.adminEmail,
      "para empresa:",
      payload.companyName
    );
  }
  return { ok: true };
}
