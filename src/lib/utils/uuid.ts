/**
 * Génère un UUID v4 qui devrait être unique.
 * Utilise crypto.randomUUID() en HTTPS/localhost, et bascule sur un polyfill en HTTP local.
 */
export function generateUUID(): string {
  // 1. Si disponible (HTTPS ou localhost)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // 2. Si crypto.getRandomValues est disponible en HTTP
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  // 3. Fallback universel (pour dev local hors ligne)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
